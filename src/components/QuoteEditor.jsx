import React, { useRef, useState } from 'react'
import {
  Box, TextField, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Select, MenuItem, InputLabel, FormControl, Stack, Typography,
  Snackbar, Alert
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const currencySymbols = { TWD: 'NT$', USD: '$' }

function formatMoney(v,currency){
  return currencySymbols[currency] + ' ' + Number(v||0).toLocaleString()
}

export default function QuoteEditor(){
  const [items,setItems] = useState([{name:'', qty:1, price:0}])
  const [customer,setCustomer] = useState({name:'', contact:'', address:''})
  const [taxMode,setTaxMode] = useState('自填')
  const [taxValue,setTaxValue] = useState(0)
  const [discountType,setDiscountType] = useState('amount')
  const [discountValue,setDiscountValue] = useState(0)
  const [currency,setCurrency] = useState('TWD')
  const [logoData,setLogoData] = useState(null)
  const [snackbar, setSnackbar] = useState({open:false, message:'', severity:'warning'})
  const [firstInvalidIndex, setFirstInvalidIndex] = useState(null)
  const previewRef = useRef()

  const changeItem = (i, key, val)=>{
    const coerced = (key==='qty' || key==='price') ? (val===''? '' : Number(val)) : val
    const next = items.map((it,idx)=> idx===i? {...it,[key]:coerced}:it)
    setItems(next)
  }
  const addItem = ()=> setItems([...items, {name:'', qty:1, price:0}])
  const removeItem = (i)=> setItems(items.filter((_,idx)=>idx!==i))

  const subtotal = items.reduce((s,it)=> s + (Number(it.qty||0)*Number(it.price||0)),0)
  const taxRate = taxMode==='自填'? Number(taxValue||0)/100 : taxMode==='5%'?0.05: taxMode==='8%'?0.08:0
  const taxAmount = subtotal * taxRate
  const discountAmount = discountType==='percent' ? subtotal * (Number(discountValue||0)/100) : Number(discountValue||0)
  const total = subtotal + taxAmount - discountAmount

  function handleLogo(e){
    const f = e.target.files?.[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> setLogoData(reader.result)
    reader.readAsDataURL(f)
  }

  async function exportPDF(){
    // 驗證每一項產品
    const invalidIndex = items.findIndex(it=> !it.name || String(it.name).trim()==='' || Number(it.qty)<=0 || Number(it.price)<=0 )
    if(invalidIndex !== -1){
      setFirstInvalidIndex(invalidIndex)
      // focus first invalid field in DOM
      setTimeout(()=>{
        const it = items[invalidIndex]
        if(!it.name || String(it.name).trim()===''){
          const el = document.getElementById(`name-input-${invalidIndex}`)
          el?.focus()
        } else if(Number(it.qty) <= 0){
          const el = document.getElementById(`qty-input-${invalidIndex}`)
          el?.focus()
        } else {
          const el = document.getElementById(`price-input-${invalidIndex}`)
          el?.focus()
        }
      },50)
      setSnackbar({open:true, message:'請修正產品欄位：品名不可為空、數量與單價需大於 0', severity:'error'})
      return
    }
    setFirstInvalidIndex(null)

    const el = previewRef.current
    if(!el) return
    const canvas = await html2canvas(el, { scale:2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit:'pt', format:'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgProps = pdf.getImageProperties(imgData)
    const imgWidth = pageWidth - 40
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)
    pdf.save('quote.pdf')
  }


  return (
    <Stack spacing={2}>
      <Box sx={{display:'flex',gap:2}}>
        <TextField label="客戶名稱" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} />
        <TextField label="聯絡方式" value={customer.contact} onChange={e=>setCustomer({...customer,contact:e.target.value})} />
        <TextField label="地址" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} sx={{flex:1}} />
      </Box>

      <Box sx={{display:'flex',gap:2, alignItems:'center'}}>
        <FormControl sx={{minWidth:120}}>
          <InputLabel>幣別</InputLabel>
          <Select value={currency} label="幣別" onChange={e=>setCurrency(e.target.value)}>
            <MenuItem value={'TWD'}>TWD</MenuItem>
            <MenuItem value={'USD'}>USD</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{minWidth:140}}>
          <InputLabel>稅金</InputLabel>
          <Select value={taxMode} label="稅金" onChange={e=>setTaxMode(e.target.value)}>
            <MenuItem value={'自填'}>自填</MenuItem>
            <MenuItem value={'5%'}>5%</MenuItem>
            <MenuItem value={'8%'}>8%</MenuItem>
          </Select>
        </FormControl>
        {taxMode==='自填' && (
          <TextField label="稅率 (%)" value={taxValue} onChange={e=>setTaxValue(e.target.value)} sx={{width:120}} />
        )}

        <FormControl sx={{minWidth:140}}>
          <InputLabel>折扣類型</InputLabel>
          <Select value={discountType} label="折扣類型" onChange={e=>setDiscountType(e.target.value)}>
            <MenuItem value={'amount'}>金額</MenuItem>
            <MenuItem value={'percent'}>百分比</MenuItem>
          </Select>
        </FormControl>
        <TextField label="折扣" value={discountValue} onChange={e=>setDiscountValue(e.target.value)} sx={{width:140}} />

        <Button variant="contained" component="label">上傳公司 Logo
          <input hidden accept="image/*" type="file" onChange={handleLogo} />
        </Button>
        {logoData && (
          <Button variant="outlined" color="error" onClick={()=>setLogoData(null)} sx={{ml:1}}>移除 Logo</Button>
        )}
      </Box>

      <Box>
        <Box sx={{ maxHeight: 300, overflow: 'auto', background: '#fff', borderRadius:1, border: '1px solid rgba(0,0,0,0.06)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>產品品名</TableCell>
                <TableCell>數量</TableCell>
                <TableCell>單價</TableCell>
                <TableCell>總價</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it,i)=> {
                const nameErr = !it.name || String(it.name).trim()===''
                const qtyErr = Number(it.qty) <= 0
                const priceErr = Number(it.price) <= 0
                return (
                <TableRow key={i}>
                  <TableCell>
                    <TextField
                      id={`name-input-${i}`}
                      value={it.name}
                      onChange={e=>changeItem(i,'name',e.target.value)}
                      error={nameErr}
                      helperText={nameErr? '品名不得為空':''}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      id={`qty-input-${i}`}
                      type="number"
                      inputProps={{min:1}}
                      value={it.qty}
                      onChange={e=>changeItem(i,'qty',e.target.value)}
                      sx={{width:100}}
                      error={qtyErr}
                      helperText={qtyErr? '數量需大於 0':''}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      id={`price-input-${i}`}
                      type="number"
                      inputProps={{min:1, step:0.01}}
                      value={it.price}
                      onChange={e=>changeItem(i,'price',e.target.value)}
                      sx={{width:140}}
                      error={priceErr}
                      helperText={priceErr? '單價需大於 0':''}
                    />
                  </TableCell>
                  <TableCell>{formatMoney(Number(it.qty||0)*Number(it.price||0), currency)}</TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={()=>removeItem(i)}><DeleteIcon/></IconButton>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </Box>
        <Button startIcon={<AddIcon />} onClick={addItem} sx={{mt:1}}>新增項目</Button>
      </Box>

      <Box sx={{display:'flex',gap:2}}>
        <Button variant="outlined" onClick={exportPDF}>下載 PDF</Button>
      </Box>

      <Box ref={previewRef} className="preview-card">
        <Box sx={{display:'flex',justifyContent:'space-between', alignItems:'center', mb:2}}>
          <Box>
            <Typography variant="h6">報價單</Typography>
            <Typography>客戶: {customer.name}</Typography>
            <Typography>聯絡: {customer.contact}</Typography>
          </Box>
          <Box>
            {logoData && <img src={logoData} alt="logo" style={{height:60}} />}
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>產品</TableCell>
              <TableCell>數量</TableCell>
              <TableCell>單價</TableCell>
              <TableCell>總價</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((it,i)=> (
              <TableRow key={i} sx={ i===firstInvalidIndex ? { border: '1px solid #f44336', background: '#fff6f6' } : {} }>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.qty}</TableCell>
                <TableCell>{formatMoney(it.price, currency)}</TableCell>
                <TableCell>{formatMoney(Number(it.qty||0)*Number(it.price||0), currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{mt:2, display:'flex', flexDirection:'column', gap:1, alignItems:'flex-end'}}>
          <Typography>小計: {formatMoney(subtotal, currency)}</Typography>
          <Typography>稅金: {formatMoney(taxAmount, currency)}</Typography>
          <Typography>折扣: {formatMoney(discountAmount, currency)}</Typography>
          <Typography variant="h6">總計: {formatMoney(total, currency)}</Typography>
        </Box>
      </Box>
    </Stack>
  )
}
