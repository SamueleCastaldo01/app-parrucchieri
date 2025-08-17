// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.gumroadWebhook = onRequest(async (req, res) => {
  const body = req.body || {};
  // parsed raw body logging (utile)
  logger.info("Raw body:", req.rawBody ? req.rawBody.toString().slice(0,1000) : "<empty>");
  logger.info("Parsed body:", body);

  // idempotency: usa sale_id o subscription_id o un event_id se presente
  const eventId = body.sale_id || body.subscription_id || body.sale?.id || body.sale?.sale_id || `evt_${Date.now()}`;

  // salva evento in webhookEvents per evitare doppio processing
  const eventRef = db.collection("webhookEvents").doc(eventId);
  const already = (await eventRef.get()).exists;
  if (already) {
    logger.info("Event già processato:", eventId);
    return res.status(200).send("Already processed");
  }
  await eventRef.set({ receivedAt: admin.firestore.FieldValue.serverTimestamp(), raw: body });

  // estrazione uid da url_params o custom_fields
  let urlParams = {};
  try {
    if (body.url_params) {
      urlParams = typeof body.url_params === "string" ? JSON.parse(body.url_params) : body.url_params;
    }
  } catch (e) {
    logger.warn("url_params non JSON", e);
  }
  const firebaseUid = urlParams?.uid || body.firebase_uid || body['custom_fields']?.firebase_uid || null;

  // helper per aggiornare user doc
  const updateUser = async (uid, data) => {
    const userRef = db.collection("users").doc(uid);
    await userRef.set({ abbonamento: data }, { merge: true });
    logger.info("Aggiornato Firestore per UID", uid, data);
  };

  // Gestione ping
  if (body.ping) {
    logger.info("Ping ricevuto");
    await eventRef.update({ handled: true });
    return res.status(200).send("Ping ricevuto");
  }

  // Gestione vendita / abbonamento creato
  if (body.sale || body.sale_id || body.product_id) {
    const sale = body.sale || body;
    const email = sale.email || sale['email'];
    const productId = sale.product_id || sale['product_id'];
    const saleId = sale.sale_id || sale['sale_id'] || sale.id;
    const subscriptionId = sale.subscription_id || sale['subscription_id'];
    const recurrence = sale.recurrence || sale['recurrence'] || null;
    const test = sale.test === "true" || sale.test === true;

  //controllo statico dell'abbonamento in questo modo deve essere porpio questo
  const TARGET_PRODUCT_ID = "1UwqTMdFqmS7tdHhxcifeA==";
  if (productId !== TARGET_PRODUCT_ID) {
    logger.info("Ignorato: prodotto diverso", { productId });
    await eventRef.update({ handled: true, ignored: true });
    return res.status(200).send("Ignored: not target product");
  }

    const abbonamento = {
      active: true,
      productId,
      saleId,
      subscriptionId: subscriptionId || null,
      recurrence,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelled: false,
      cancelledAt: null,
      endsAt: null,
      test,
      lastCheckedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (firebaseUid) {
      await updateUser(firebaseUid, abbonamento);
    } else if (email) {
      // fallback: cerca user per email
      const q = await db.collection("users").where("email", "==", email).get();
      if (!q.empty) {
        const batch = db.batch();
        q.forEach(docSnap => batch.set(docSnap.ref, { abbonamento }, { merge: true }));
        await batch.commit();
        logger.info("Aggiornati utenti trovati per email", email);
      } else {
        // salva log per mapping manuale
        await db.collection("pendingPurchases").add({
          email, abbonamento, raw: body, createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.warn("Nessun utente trovato con email", email, "salvato in pendingPurchases");
      }
    }

    await eventRef.update({ handled: true });
    return res.status(200).send("Sale processed");
  }

  // Gestione cancellazione (cancellation)
  if (body.cancelled || body.ended_at || body.ended_reason || body.resource_name === "cancellation" || body.resource_name === "subscription_ended") {
    // estrai subscription_id / sale_id / email ecc.
    const subscriptionId = body.subscription_id || body['subscription_id'] || null;
    const email = body.email || body['email'];
    const endedAt = body.ended_at || body['ended_at'] || null;
    const cancelled = !!body.cancelled;
    const cancelledAt = body.cancelled_at || body['cancelled_at'] || null;
    // aggiorna user: se abbiamo uid -> aggiorna, altrimenti per email
    const updates = {
      "abbonamento.active": false,
      "abbonamento.cancelled": cancelled || true,
      "abbonamento.cancelledAt": cancelledAt || endedAt || admin.firestore.FieldValue.serverTimestamp(),
      "abbonamento.endsAt": endedAt || cancelledAt || admin.firestore.FieldValue.serverTimestamp(),
      "abbonamento.lastCheckedAt": admin.firestore.FieldValue.serverTimestamp()
    };

    if (firebaseUid) {
      await db.collection("users").doc(firebaseUid).set(updates, { merge: true });
    } else if (email) {
      const q = await db.collection("users").where("email", "==", email).get();
      if (!q.empty) {
        const batch = db.batch();
        q.forEach(docSnap => batch.set(docSnap.ref, updates, { merge: true }));
        await batch.commit();
      } else {
        await db.collection("pendingPurchases").add({ email, updates, raw: body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    }
    await eventRef.update({ handled: true });
    return res.status(200).send("Cancellation processed");
  }

  // fallback: log
  logger.info("Webhook non riconosciuto, loggato per debug", body);
  await eventRef.update({ handled: true });
  return res.status(200).send("ok");
});
