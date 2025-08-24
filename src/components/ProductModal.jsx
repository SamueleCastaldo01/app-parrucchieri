import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, Button, Typography, Chip,
  Divider, CircularProgress, Box, IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Close";
import { db, storage } from "../firebase-config";
import { addDoc, updateDoc, collection, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const MAX_TOTAL_IMAGES = 5;
const ACCEPTED = ["image/jpeg", "image/png"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const THUMB = 110; // lato anteprima (px)

export default function ProductModal({
  open,
  onClose,
  initialData = null, // { id, nome, tag, prezzo, descrizione, images: [] }
  onSaved,
}) {
  const isEdit = Boolean(initialData?.id);

  // campi
  const [nome, setNome] = useState("");
  const [tag, setTag] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [descrizione, setDescrizione] = useState("");

  // immagini UNIFICATE (url già salvate + nuovi file)
  // ogni item: { kind: "url"|"file", url?: string, file?: File, preview: string }
  const [mediaItems, setMediaItems] = useState([]);
  const initialUrlsRef = useRef([]); // per capire quali url sono state rimosse in edit

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setNome(initialData?.nome || "");
      setTag(initialData?.tag || "");
      setPrezzo(String(initialData?.prezzo ?? ""));
      setDescrizione(initialData?.descrizione || "");
      const urls = Array.isArray(initialData?.images) ? initialData.images : [];
      initialUrlsRef.current = urls;
      setMediaItems(
        urls.map((u) => ({ kind: "url", url: u, preview: u }))
      );
    } else {
      setNome("");
      setTag("");
      setPrezzo("");
      setDescrizione("");
      initialUrlsRef.current = [];
      setMediaItems([]);
    }
  }, [open, isEdit, initialData]);

  const remainingSlots = useMemo(
    () => Math.max(0, MAX_TOTAL_IMAGES - mediaItems.length),
    [mediaItems.length]
  );

  // -------- aggiunta file (click/drag) ----------
  const validateFiles = (list) => {
    const valid = [];
    const errors = [];
    for (const f of list) {
      if (!ACCEPTED.includes(f.type)) { errors.push(`"${f.name}" non è JPG/PNG`); continue; }
      if (f.size > MAX_SIZE) { errors.push(`"${f.name}" supera 2MB`); continue; }
      valid.push(f);
    }
    return { valid, errors };
  };

  const handleAddFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const { valid, errors } = validateFiles(incoming);
    const allowed = valid.slice(0, remainingSlots);

    const toAdd = allowed.map((f) => ({
      kind: "file",
      file: f,
      preview: URL.createObjectURL(f),
    }));
    if (toAdd.length) setMediaItems((arr) => [...arr, ...toAdd]);

    if (errors.length || valid.length > allowed.length) {
      const msgs = [
        ...errors,
        valid.length > allowed.length ? `Puoi avere al massimo ${MAX_TOTAL_IMAGES} immagini totali.` : null,
      ].filter(Boolean);
      alert(msgs.join("\n"));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropActive(false);
    handleAddFiles(e.dataTransfer.files);
  };
  const onDragOver = (e) => { e.preventDefault(); setIsDropActive(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDropActive(false); };

  // -------- rimozione ----------
  const removeAt = (idx) => {
    setMediaItems((arr) => arr.filter((_, i) => i !== idx));
  };

  // -------- riordino ----------
  const onThumbDragStart = (idx) => (e) => {
    setDragIndex(idx);
    try { e.dataTransfer.setData("text/plain", String(idx)); } catch {}
    e.dataTransfer.effectAllowed = "move";
  };
  const onThumbDragOver = (overIdx) => (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onThumbDrop = (overIdx) => (e) => {
    e.preventDefault();
    const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from) || from === null || from === overIdx) return;
    setMediaItems((arr) => {
      const next = arr.slice();
      const [moved] = next.splice(from, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    setDragIndex(null);
  };
  const onThumbDragEnd = () => setDragIndex(null);

  // -------- salvataggio ----------
  const handleSave = async () => {
    if (!nome.trim()) return alert("Inserisci il nome");
    if (mediaItems.length > MAX_TOTAL_IMAGES) {
      return alert(`Puoi avere al massimo ${MAX_TOTAL_IMAGES} immagini totali`);
    }

    setSaving(true);
    try {
      if (!isEdit) {
        // CREATE
        const col = collection(db, "shop_items");
        const docRef = await addDoc(col, {
          nome: nome.trim(),
          tag: tag.trim(),
          prezzo: parseFloat(prezzo),
          descrizione: descrizione.trim(),
          images: [],
          createdAt: serverTimestamp(),
        });

        // upload mantenendo l'ORDINE
        const finalUrls = [];
        for (const item of mediaItems) {
          if (item.kind === "url") {
            finalUrls.push(item.url);
          } else {
            const f = item.file;
            const storageRef = ref(storage, `shop_items/${docRef.id}/${Date.now()}_${f.name}`);
            await uploadBytes(storageRef, f);
            finalUrls.push(await getDownloadURL(storageRef));
          }
        }
        await updateDoc(docRef, { images: finalUrls });
      } else {
        // UPDATE
        const refDoc = doc(db, "shop_items", initialData.id);

        // calcolo URL rimossi (da cancellare dallo storage)
        const keptUrls = mediaItems.filter((i) => i.kind === "url").map((i) => i.url);
        const removed = initialUrlsRef.current.filter((u) => !keptUrls.includes(u));

        // costruisco la lista finale rispettando l'ORDINE corrente
        const finalUrls = [];
        for (const item of mediaItems) {
          if (item.kind === "url") {
            finalUrls.push(item.url);
          } else {
            const f = item.file;
            const storageRef = ref(storage, `shop_items/${initialData.id}/${Date.now()}_${f.name}`);
            await uploadBytes(storageRef, f);
            finalUrls.push(await getDownloadURL(storageRef));
          }
        }

        await updateDoc(refDoc, {
          nome: nome.trim(),
          tag: tag.trim(),
          prezzo: parseFloat(prezzo),
          descrizione: descrizione.trim(),
          images: finalUrls,
        });

        // rimuovo dal bucket gli URL eliminati
        for (const url of removed) {
          try { await deleteObject(ref(storage, url)); } catch (e) { console.warn("Del fallita:", e?.message); }
        }
      }

      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Errore nel salvataggio del prodotto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? "Modifica prodotto" : "Nuovo prodotto"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* campi */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth required />
            <TextField label="Tag" value={tag} onChange={(e) => setTag(e.target.value)} fullWidth />
            <TextField
              label="Prezzo" type="number" inputProps={{ min: 0, step: "0.01" }}
              value={prezzo} onChange={(e) => setPrezzo(e.target.value)} fullWidth
            />
          </Stack>

          <TextField
            label="Descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            fullWidth multiline minRows={3}
          />

          {/* area unica: drop + griglia ordinabile */}
          <Box
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 2,
              textAlign: "center",
              border: "2px dashed",
              borderColor: isDropActive ? "primary.main" : "divider",
              borderRadius: 2,
              cursor: "pointer",
              bgcolor: isDropActive ? "action.hover" : "background.paper",
              transition: "all .15s ease",
            }}
          >
            <Typography variant="body2">
              Trascina qui JPG/PNG (max 2MB per immagine) oppure <b>clicca</b> per selezionare —&nbsp;
              <b>{mediaItems.length}/{MAX_TOTAL_IMAGES}</b>
            </Typography>

              <Typography variant="caption" color="text.secondary">
                Consigliato: caricare immagini con proporzioni <b>1:1</b> (quadrate)
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(e) => { handleAddFiles(e.target.files); e.target.value = ""; }}
              style={{ display: "none" }}
            />

            {mediaItems.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                  {mediaItems.map((it, idx) => {
                    const isPrimary = idx === 0;
                    return (
                      <Box
                        key={it.preview || it.url}
                        draggable
                        onDragStart={onThumbDragStart(idx)}
                        onDragOver={onThumbDragOver(idx)}
                        onDrop={onThumbDrop(idx)}
                        onDragEnd={onThumbDragEnd}
                        sx={{
                          width: THUMB,
                          height: THUMB,
                          position: "relative",
                          borderRadius: 1,
                          overflow: "hidden",
                          boxShadow: isPrimary ? 2 : 1,
                          outline: isPrimary ? (theme) => `2px solid ${theme.palette.primary.main}` : "none",
                          cursor: "grab",
                          backgroundColor: "action.hover",
                        }}
                        title="Trascina per cambiare ordine"
                      >
                        <img
                          src={it.preview}
                          alt="img"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />

                        {isPrimary && (
                          <Chip
                            size="small"
                            label="Principale"
                            sx={{
                              position: "absolute",
                              top: 6, left: 6,
                              bgcolor: "rgba(0,0,0,0.6)", color: "common.white",
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        )}

                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); removeAt(idx); }}
                          sx={{
                            position: "absolute",
                            top: 4, right: 4,
                            bgcolor: "rgba(0,0,0,0.5)", color: "common.white",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                          }}
                          aria-label="rimuovi immagine"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Annulla</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={22} /> : (isEdit ? "Salva modifiche" : "Crea prodotto")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
