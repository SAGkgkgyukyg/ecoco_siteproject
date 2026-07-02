import React from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import QuoteEditor from './components/QuoteEditor'

export default function App(){
  return (
    <Container className="container">
      <Typography variant="h4" gutterBottom sx={{mt:2, mb:2}}>
        自動報價單產生器
      </Typography>
      <QuoteEditor />
    </Container>
  )
}
