import React from 'react'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SettingsIcon from '@mui/icons-material/Settings';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { motion } from 'framer-motion';

function Homepage ()  {

    const [flagCont, setFlagCont] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    localStorage.setItem("naviBottom", 0);

    let navigate = useNavigate();
  
    const handleClickOpen = () => {
        setOpen(true);
      };
    
      const handleClose = () => {
        setOpen(false);
      };

    const buttonStyle = {
        width: '80%', // Personalizza la larghezza del bottone
        height: "120px",
        marginBottom: "20px",
        textColor: "#333"
      };

    return (
        <>
{/**************NAVBAR MOBILE*************************************** */}


      <motion.div
        initial= {{opacity: 0}}
        animate= {{opacity: 1}}
        transition={{ duration: 0.7 }}>
      <div className='px-4 px-lg-0'>
        <h1 className='titlePage'>Dashboard App Parrucchieri</h1>
        <div className='mt-4 d-flex flex-column gap-3 justify-content-start'>
          <img style={{width: "400px"}}  src=''/>
          <div className='d-flex gap-3'>
            <Button startIcon={<SettingsIcon/>} style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/configstore")}}>Store</Button>
          </div>
          <div className='d-flex gap-3 mt-3'>
            <Button startIcon={<ContentCutIcon/>} style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/servizilist")}}>Servizi</Button>
            <Button startIcon={<Diversity3Icon/>}  style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/employeelist")}}>Dipendenti</Button>
          </div>
          <div className='d-flex gap-3 mt-3'>
            <Button startIcon={<EventAvailableIcon/>} style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/bookingsreview")}}>Prenotazioni</Button>
          </div>
        </div>
      
      </div>

      </motion.div>
        </>
    )

}

export default Homepage 
