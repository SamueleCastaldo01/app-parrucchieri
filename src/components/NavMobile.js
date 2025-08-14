import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NavMobile() {
    const navigate = useNavigate();
    return(
        <>
           <div style={{zIndex: "1", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)"}} className="primaryBack position-fixed top-0 w-100 p-1 text-start d-flex align-items-center gap-2">
                <IconButton onClick={() => {navigate(-1)}}>
                    <ArrowBackIcon style={{fontSize: "30px"}}/>
                </IconButton>
         
            <h5 className="mb-0">App Parrucchieri</h5>
          
       
        </div>
        </>
    )
}