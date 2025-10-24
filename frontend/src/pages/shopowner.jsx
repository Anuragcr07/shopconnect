import React from 'react'

const ShopOwner = () => {
  return (
    <div>
      <Navbar />
      <h1>Shop Owner Page</h1>
      <h2>product details</h2>    
      <TextField
       id="item-name"
       label="Product Name" 
       value={name}
       onChange={e => setName(e.target.value)}
       variant="outlined" />
      <TextField
       id="quantity"
       label="Quantity"
       value={quantity}
       onChange={e => setQuantity(e.target.value)}
       variant="outlined" />
    </div>
  )
}

export default ShopOwner
