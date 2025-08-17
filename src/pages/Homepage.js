import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SettingsIcon from '@mui/icons-material/Settings';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { motion } from 'framer-motion';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import StripeBuyButton from "../components/StripeBuyButtoon";

function Homepage() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className='px-4 px-lg-0'>
        <h1 className='titlePage'>Dashboard App Parrucchieri</h1>
        <div className='mt-4 d-flex flex-column gap-3 justify-content-start'>
          <img style={{ width: "400px" }} src='' alt='' />
          
          <div className='d-flex gap-3'>
            <Button startIcon={<SettingsIcon />} style={{ width: "200px", height: "70px" }} variant="contained" onClick={() => navigate("/configstore")}>Store</Button>
          </div>
          <div className='d-flex gap-3 mt-3'>
            <Button startIcon={<ContentCutIcon />} style={{ width: "200px", height: "70px" }} variant="contained" onClick={() => navigate("/servizilist")}>Servizi</Button>
            <Button startIcon={<Diversity3Icon />} style={{ width: "200px", height: "70px" }} variant="contained" onClick={() => navigate("/employeelist")}>Dipendenti</Button>
          </div>
          <div className='d-flex gap-3 mt-3'>
            <Button startIcon={<EventAvailableIcon />} style={{ width: "200px", height: "70px" }} variant="contained" onClick={() => navigate("/bookingsreview")}>Prenotazioni</Button>
          </div>

          <div className='d-flex gap-3 mt-3'>
            <StripeBuyButton />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Homepage;
