import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
   
     <MantineProvider>
     
         
      <App />
      
     </MantineProvider>
 
      
   
  </React.StrictMode>
)
