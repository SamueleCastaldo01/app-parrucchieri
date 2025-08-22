// components/MiniDrawer.jsx
import * as React from "react";
import { useState } from "react";
import { styled } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar as MuiAppBar,
  Toolbar,
  CssBaseline,
  Box,
  Drawer as MuiDrawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Avatar,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ManageBillingButton from "./ManageBillingButton";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

const DRAWER_WIDTH = 280;
const PRIMARY   = "#3a51b0";
const SECONDARY = "#e8eaf4";
const WHITE     = "#ffffff";
const HOVER_BG  = "rgba(58,81,176,0.08)"; // blu molto chiaro per hover

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: WHITE,
  color: PRIMARY,
  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
}));

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    border: "none",
    backgroundColor: WHITE,
    color: PRIMARY,
    ...closedMixin(theme),

    // --- QUI aggiungiamo ombra o bordo ---
    boxShadow: "2px 0 6px rgba(0,0,0,0.08)",   // ombra leggera a destra
    // borderRight: "1px solid rgba(0,0,0,0.1)", // bordo grigio chiaro
  },
  ...closedMixin(theme),
}));


// voce menu piatta
function NavItem({ open, icon, label, selected, onClick }) {
  const content = (
    <ListItemButton
      onClick={onClick}
      selected={selected}
      sx={{
        mx: 1,
        my: 0.5,
        borderRadius: 2,
        px: open ? 2 : 1.5,
        "& .MuiListItemIcon-root": { color: PRIMARY },
        "& .MuiListItemText-primary": {
          color: PRIMARY,
          fontWeight: 700,
          letterSpacing: 0.2,
        },
        "&.Mui-selected": {
          bgcolor: SECONDARY,
          "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: PRIMARY },
        },
        "&.Mui-selected:hover": { bgcolor: SECONDARY },
        "&:hover": { bgcolor: selected ? SECONDARY : HOVER_BG },
        position: "relative",
      }}
    >
      <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : "auto" }}>{icon}</ListItemIcon>
      <ListItemText primary={label} sx={{ opacity: open ? 1 : 0 }} />
    </ListItemButton>
  );

  if (open) return content;
  return (
    <Tooltip title={label} placement="right">
      {content}
    </Tooltip>
  );
}

export default function MiniDrawer({ signUserOut }) {
  const navigate = useNavigate();
  const location = useLocation();
  const open = false; // sempre chiuso

  // stato menu utente
  const [anchorElUser, setAnchorElUser] = useState(null);
  const openUserMenu = Boolean(anchorElUser);
  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const isSel = (path) => location.pathname === path;

  const goProfile = () => { handleCloseUserMenu(); navigate("/userprofile"); };
  const goAbbomaneto = () => { handleCloseUserMenu(); navigate("/abbonamento"); };
  const goSettings = () => { handleCloseUserMenu(); navigate("/configstore"); };
  const doLogout = async () => {
    handleCloseUserMenu();
    try { await signUserOut?.(); }
    finally {
      localStorage.setItem("isAuth", "false");
      navigate("/admin");
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <AppBar position="fixed">
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: 45, height: 'auto', borderRadius: 6 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 900, color: PRIMARY }}>
              App Parrucchieri
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ManageBillingButton />
            <Tooltip title="Account">
              <Avatar
                src={localStorage.getItem("profilePic") || ""}
                alt="profile"
                sx={{ width: 34, height: 34, border: "2px solid " + PRIMARY, cursor: "pointer" }}
                onClick={handleOpenUserMenu}
              />
            </Tooltip>

            <Menu
              anchorEl={anchorElUser}
              open={openUserMenu}
              onClose={handleCloseUserMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{
                elevation: 6,
                sx: { mt: 1, minWidth: 200, borderRadius: 2 },
              }}
            >
              <MenuItem onClick={goProfile}>
                <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                Profilo
              </MenuItem>
              <MenuItem onClick={goAbbomaneto}>
                <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                Abbonamenti
              </MenuItem>
              <MenuItem onClick={goSettings}>
                <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
                Impostazioni
              </MenuItem>
              <Divider />
              <MenuItem onClick={doLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent">
        <DrawerHeader><Box sx={{ height: 36 }} /></DrawerHeader>

        <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />

        <List sx={{ pt: 1 }}>
          <NavItem open={open} icon={<HomeIcon />}           label="Home"         selected={isSel("/")}                 onClick={() => navigate("/")} />
          <NavItem open={open} icon={<ContactPageIcon />}    label="Clienti"      selected={isSel("/customerlist")}    onClick={() => navigate("/customerlist")} />
          <NavItem open={open} icon={<Diversity3Icon />}     label="Dipendenti"   selected={isSel("/employeelist")}    onClick={() => navigate("/employeelist")} />
          <NavItem open={open} icon={<ContentCutIcon />}     label="Servizi"      selected={isSel("/servizilist")}     onClick={() => navigate("/servizilist")} />
          <NavItem open={open} icon={<EventAvailableIcon />} label="Prenotazioni" selected={isSel("/bookingsreview")}   onClick={() => navigate("/bookingsreview")} />
        </List>
      </Drawer>
    </Box>
  );
}
