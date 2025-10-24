import React from 'react'
import Navbar from '../components/Navbar.jsx'
import {useForm} from 'react-hook-form';

const Customer = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const onSubmit = values => console.log(values);   
  return (
    <div>
      <Navbar />
      <h1>Customer Page</h1>
      <p>Welcome to the customer page!</p>
      <form onSubmit = {handleSubmit(onSubmit)}>
        <input type="text" placeholder='item name' {...register('itemName', {required: true, maxLength: 20})} />
        {errors.itemName && <p>Item name is required and should be less than 20 characters</p>}
        <br />
        <input type="number" placeholder='quantity' {...register('quantity', {required: true, min: 1, max: 100})} />
        {errors.quantity && <p>Quantity is required and should be between 1 and 100</p>}
        <br />
        <button type="submit">Add to Cart</button>
      </form>
    </div>
  )
}

export default Customer 
