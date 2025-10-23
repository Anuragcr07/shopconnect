import React from 'react';

const Navbar = () => (
  <>
    <h1>Sign in to ShopConnect</h1>
    <form action="/auth/signin" method="POST">
      <label htmlFor="email">Email:</label>
      <input type="email" name="email" id="email" required />
      <br />
      <label htmlFor="password">Password:</label>
      <input type="password" name="password" id="password" required />
      <br />
      <button type="submit">Sign In</button>
    </form>
  </>
);

export default Navbar;
