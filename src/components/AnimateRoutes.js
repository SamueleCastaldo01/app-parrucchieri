import React from 'react'
import { useState, useEffect } from "react";
import Homepage from '../pages/Homepage'
import { useSelector } from 'react-redux'; 
import Login from '../pages/Login';
import { LoginUser } from '../pages/LoginUser';
import { CustomerList } from '../pages/CustomerList';
import { DashboardCustomer } from '../pages/DashboardCustomer';
import Page_per from '../pages/Page_per';
import { BrowserRouter as Router, Routes, Route, Link, useLocation} from "react-router-dom";
import {PrivateRoutes, PrivatePerm, PrivateRoutesUser} from '../components/PrivateRoutes';
import { AnimatePresence } from 'framer-motion';
import moment from 'moment/moment';
import 'moment/locale/it'
import { UserHome } from '../pages/UserHome';
import { UserScheda } from '../pages/UserScheda';
import { UserProfile } from '../pages/UserProfile';
import { Register } from '../pages/Register';
import { EmployeeList } from '../pages/EmployeeList';
import { EmployeeAdd } from '../pages/EmployeeAdd';
import { ServiziList } from '../pages/ServiziList';



function AnimateRoutes ()  {
    
    

    const location = useLocation();
    //const [isAuth, setIsAuth] = useState(localStorage.getItem("isAuth"));
    const isAuth = useSelector((state) => state.auth.isAuth);
    const isAuthUser = useSelector((state) => state.userAuth.isAuthUser); //questo per gli utenti


    const timeElapsed = Date.now();  //prende la data attuale in millisecondi
    const today = new Date(timeElapsed);    //converte nel tipo data
    var formattedDate = moment(today).format('DD-MM-YYYY');  //coverte nel formato richiesto
    localStorage.setItem("today", formattedDate);
    const [todayC, setTodayC] = useState(localStorage.getItem("today"));  //variabile che andiamo ad utilizzare



return (

    <AnimatePresence>
    <Routes location={location} key={location.pathname}>
      {/**qui ci vanno quelli che non servono i permessi, o se ne creano degli altri */}

    <Route element={<PrivateRoutes isAuth={isAuth} isAuthUser={isAuthUser}/>}> 
    <Route element={<PrivatePerm/>}>

    <Route path="/" element={<Homepage />} /> 
    <Route path="/customerlist" element={<CustomerList />} /> 
    <Route path="/employeelist" element={<EmployeeList />} /> 
    <Route path="/employeeadd" element={<EmployeeAdd />} /> 
    <Route path="/servizilist" element={<ServiziList />} /> 
    <Route path="/dashboardcustomer/:id" element={<DashboardCustomer />} /> 
    
    </Route>
    </Route>

    <Route element={<PrivateRoutesUser isAuthUser={isAuthUser}/>}> 
    <Route path="/userscheda/:idcustomer/:idscheda" element={<UserScheda />} /> 
    <Route path="/userhome" element={<UserHome />} /> 
    <Route path="/userprofile" element={<UserProfile />} /> 
    </Route>


    <Route path="/admin" element={<Login  />} />
    <Route path="/login" element={<LoginUser/>} />
    <Route path="/register" element={<Register />} /> 
    <Route path="/block" element={<Page_per/>} />
    {isAuth ? <Route path="*" element={<Page_per /> }/> :
              <Route path="*" element={<Login  />}/>    }



    </Routes>


    </AnimatePresence>

    )

}

export default AnimateRoutes 