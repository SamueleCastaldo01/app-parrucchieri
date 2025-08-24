// pages/ManageProducts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db, storage } from "../firebase-config";
import {
  collection, getDocs, deleteDoc, doc,
  query, orderBy, limit, startAfter, getCountFromServer
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import {
  Container, Paper, Typography, Card, CardContent, Grid,
  Stack, Button, Chip, Snackbar, Alert, Box, Pagination, Tooltip
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ProductModal from "../components/ProductModal";

const PAGE_SIZE = 20;
const PRIMARY = "#3a51b0"; // come Homepage

export function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const productsCollection = collection(db, "shop_items");

  const notify = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const fetchTotalCount = async () => {
    try {
      const snapshot = await getCountFromServer(productsCollection);
      const count = snapshot.data().count || 0;
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
    } catch (e) {
      console.warn("Impossibile ottenere il conteggio:", e?.message);
    }
  };

  const fetchPage = async (pageIndex = 1) => {
    setLoading(true);
    try {
      const base = query(productsCollection, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      let q = base;

      if (pageIndex > 1) {
        const cursor = pageCursors[pageIndex - 2];
        if (cursor) q = query(productsCollection, orderBy("createdAt", "desc"), startAfter(cursor), limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, _snap: d, ...d.data() }));
      setProducts(docs);

      if (docs.length > 0) {
        const lastDoc = docs[docs.length - 1]._snap;
        setPageCursors((prev) => {
          const arr = prev.slice();
          arr[pageIndex - 1] = lastDoc;
          return arr;
        });
      }
    } catch (e) {
      console.error(e);
      notify("Errore nel caricamento prodotti", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalCount();
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteProduct = async (product) => {
    const confirm = window.confirm(`Eliminare "${product.nome}"?`);
    if (!confirm) return;
    try {
      if (Array.isArray(product.images)) {
        for (const url of product.images) {
          try { await deleteObject(ref(storage, url)); } catch (e) { console.warn("Impossibile eliminare file:", e?.message); }
        }
      }
      await deleteDoc(doc(db, "shop_items", product.id));
      notify("Prodotto eliminato");
      await fetchTotalCount();
      const isNowEmpty = products.length <= 1 && page > 1;
      const nextPage = isNowEmpty ? page - 1 : page;
      setPage(nextPage);
      fetchPage(nextPage);
    } catch (err) {
      console.error(err);
      notify("Errore durante l'eliminazione", "error");
    }
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setModalOpen(true); };

  const onSaved = async () => {
    notify(editing ? "Prodotto aggiornato" : "Prodotto creato");
    await fetchTotalCount();
    fetchPage(page);
  };

  const handlePageChange = (_e, value) => {
    setPage(value);
    fetchPage(value);
  };

  const EmptyState = () => (
    <Paper elevation={0} sx={{ py: 8, textAlign: "center", bgcolor: "background.default", border: "1px dashed", borderColor: "divider" }}>
      <Inventory2OutlinedIcon sx={{ fontSize: 56, mb: 1, opacity: 0.7 }} />
      <Typography variant="h6" gutterBottom>Nessun prodotto ancora</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Inizia caricando le immagini e i dettagli del tuo primo prodotto.
      </Typography>
      <Button variant="contained" onClick={openCreate}>Crea il tuo primo prodotto</Button>
    </Paper>
  );

  const renderPrice = (prezzo) => {
    const n = Number(prezzo);
    if (!Number.isFinite(n)) return null;
    return <Chip size="small" label={`€ ${n.toFixed(2)}`} sx={{ fontWeight: 600 }} />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header in stile Homepage con icona a sinistra */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              background: "rgba(58,81,176,0.1)", display: "grid", placeItems: "center",
            }}
          >
            <Inventory2OutlinedIcon htmlColor={PRIMARY} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>
            Gestione Prodotti
          </Typography>
        </Stack>

        <Button variant="contained" onClick={openCreate} sx={{ borderRadius: 2, bgcolor: PRIMARY, "&:hover": { bgcolor: "#2f4098" } }}>
          Nuovo prodotto
        </Button>
      </Stack>

      {products.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <>
          <Typography variant="h6" gutterBottom>Prodotti</Typography>

          <Grid container spacing={2}>
            {products.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: 3,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                    "&:hover": { boxShadow: "0 10px 30px rgba(0,0,0,0.08)" },
                  }}
                >
                  {/* immagine 1:1 intera */}
                  <Box sx={{ position: "relative", width: "100%", pt: "100%", bgcolor: "background.paper" }}>
                    {Array.isArray(p.images) && p.images.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt={p.nome}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          backgroundColor: "rgba(0,0,0,0.03)",
                          display: "block",
                        }}
                      />
                    ) : (
                      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
                        <Typography variant="caption" color="text.secondary">Nessuna immagine</Typography>
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" noWrap title={p.nome}>{p.nome}</Typography>
                        {renderPrice(p.prezzo)}
                      </Stack>

                      {p.tag && <Chip size="small" label={`#${p.tag}`} />}

                      <Typography variant="body2" sx={{ minHeight: 40 }} color="text.secondary" noWrap title={p.descrizione}>
                        {p.descrizione || "—"}
                      </Typography>

                      {Array.isArray(p.images) && p.images.length > 1 && (
                        <Typography variant="caption" color="text.secondary">
                          +{p.images.length - 1} altre immagini
                        </Typography>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Tooltip title="Modifica">
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setModalOpen(true) || setEditing(p)}>
                          Modifica
                        </Button>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => handleDeleteProduct(p)}>
                          Elimina
                        </Button>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Pagination
              color="primary"
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              siblingCount={1}
              boundaryCount={1}
            />
          </Stack>
        </>
      )}

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editing}
        onSaved={onSaved}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} elevation={1} variant="filled" sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
