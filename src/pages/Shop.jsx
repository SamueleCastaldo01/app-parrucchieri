// pages/Shop.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Box, Container, Grid, Card, CardContent, Stack, Typography,
  Chip, Pagination, Skeleton, Paper, IconButton, Collapse
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  collection, getDocs, query, orderBy, limit, startAfter, getCountFromServer
} from "firebase/firestore";
import { db } from "../firebase-config";

const PAGE_SIZE = 15;
const PRIMARY = "#3a51b0";

function PriceChip({ prezzo }) {
  const n = Number(prezzo);
  if (!Number.isFinite(n)) return null;
  return <Chip size="small" label={`€ ${n.toFixed(2)}`} sx={{ fontWeight: 700 }} />;
}

function EmptyState() {
  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: "center",
        py: 8,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "background.default",
        borderRadius: 3,
      }}
    >
      <Inventory2OutlinedIcon sx={{ fontSize: 56, mb: 1, opacity: 0.7 }} />
      <Typography variant="h6" gutterBottom>Nessun prodotto al momento</Typography>
      <Typography variant="body2" color="text.secondary">
        Torna a trovarci: presto arriveranno nuovi prodotti!
      </Typography>
    </Paper>
  );
}

/** Card prodotto con:
 * - gallery scorrevole 1:1 (scroll-snap + frecce)
 * - indicatori pallini
 * - descrizione a tendina
 */
function ProductCard({ p }) {
  const images = Array.isArray(p.images) ? p.images : [];
  const hasMulti = images.length > 1;

  // gallery state
  const [idx, setIdx] = useState(0);
  const scrollerRef = useRef(null);

  const scrollTo = (next) => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: next * width, behavior: "smooth" });
  };

  const goPrev = () => {
    const next = Math.max(0, idx - 1);
    setIdx(next);
    scrollTo(next);
  };
  const goNext = () => {
    const next = Math.min(images.length - 1, idx + 1);
    setIdx(next);
    scrollTo(next);
  };

  const onScroll = (e) => {
    const el = e.currentTarget;
    const width = el.clientWidth;
    const newIdx = Math.round(el.scrollLeft / Math.max(1, width));
    if (newIdx !== idx) setIdx(newIdx);
  };

  // descrizione a tendina
  const [openDesc, setOpenDesc] = useState(false);

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        "&:hover": { boxShadow: "0 10px 30px rgba(0,0,0,0.08)" },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Wrapper 1:1 */}
      <Box sx={{ position: "relative", width: "100%", pt: "100%", bgcolor: "background.paper" }}>
        {images.length > 0 ? (
          <Box
            ref={scrollerRef}
            onScroll={hasMulti ? onScroll : undefined}
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              overflowX: hasMulti ? "auto" : "hidden",
              overflowY: "hidden",
              scrollSnapType: hasMulti ? "x mandatory" : "none",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {images.map((src, i) => (
              <Box
                key={src + i}
                sx={{
                  minWidth: "100%",
                  height: "100%",
                  position: "relative",
                  scrollSnapAlign: "start",
                  backgroundColor: "rgba(0,0,0,0.03)",
                }}
              >
                <img
                  src={src}
                  alt={p.nome}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // mostra tutta l'immagine
                    display: "block",
                    backgroundColor: "rgba(0,0,0,0.03)",
                  }}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
            <Typography variant="caption" color="text.secondary">Nessuna immagine</Typography>
          </Box>
        )}

        {/* frecce */}
        {hasMulti && (
          <>
            <IconButton
              onClick={goPrev}
              disabled={idx === 0}
              size="small"
              sx={{
                position: "absolute", top: "50%", left: 6, transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.45)", color: "common.white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
              }}
              aria-label="precedente"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={goNext}
              disabled={idx >= images.length - 1}
              size="small"
              sx={{
                position: "absolute", top: "50%", right: 6, transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.45)", color: "common.white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
              }}
              aria-label="successiva"
            >
              <ChevronRightIcon />
            </IconButton>

            {/* indicatori pallini */}
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)" }}
            >
              {images.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => { setIdx(i); scrollTo(i); }}
                  sx={{
                    width: 8, height: 8, borderRadius: "50%",
                    bgcolor: i === idx ? "primary.main" : "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(0,0,0,0.2)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight={800} noWrap title={p.nome}>
              {p.nome}
            </Typography>
            <PriceChip prezzo={p.prezzo} />
          </Stack>

          {p.tag && <Chip size="small" label={`#${p.tag}`} />}

          {/* Descrizione a tendina */}
          {p.descrizione && (
            <Box>
              <Collapse in={openDesc} collapsedSize={24 /* ~ una riga */}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {p.descrizione}
                </Typography>
              </Collapse>
              <Typography
                variant="caption"
                sx={{ mt: 0.5, display: "inline-block", cursor: "pointer", color: "primary.main", fontWeight: 600 }}
                onClick={() => setOpenDesc((v) => !v)}
              >
                {openDesc ? "Mostra meno" : "Mostra di più"}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Shop() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const colRef = collection(db, "shop_items");

  const fetchTotal = async () => {
    try {
      const snap = await getCountFromServer(colRef);
      const count = snap.data().count || 0;
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
    } catch {}
  };

  const fetchPage = async (pageIndex = 1) => {
    setLoading(true);
    try {
      let q = query(colRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      if (pageIndex > 1) {
        const cursor = pageCursors[pageIndex - 2];
        if (cursor) {
          q = query(colRef, orderBy("createdAt", "desc"), startAfter(cursor), limit(PAGE_SIZE));
        }
      }
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, _snap: d, ...d.data() }));
      setItems(docs);

      if (docs.length > 0) {
        const lastDoc = docs[docs.length - 1]._snap;
        setPageCursors((prev) => {
          const next = prev.slice();
          next[pageIndex - 1] = lastDoc;
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotal();
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (_e, value) => {
    setPage(value);
    fetchPage(value);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Header stile Homepage */}
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
            <Typography variant="h5" sx={{ fontWeight: 800, color: PRIMARY }}>
              I nostri prodotti
            </Typography>
          </Stack>
        </Stack>

        {/* Grid prodotti */}
        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06)", // ombra come le card vere
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      pt: "100%",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      sx={{ position: "absolute", inset: 0, borderRadius: 0 }}
                    />
                  </Box>
                  <CardContent>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="50%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Grid container spacing={2}>
              {items.map((p) => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <ProductCard p={p} />
                </Grid>
              ))}
            </Grid>

            {/* Paginazione */}
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                color="primary"
                count={totalPages}
                page={page}
                onChange={handleChange}
                siblingCount={1}
                boundaryCount={1}
              />
            </Stack>
          </>
        )}
      </Container>
    </motion.div>
  );
}
