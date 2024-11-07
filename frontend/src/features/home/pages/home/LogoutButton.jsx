import React, { useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { logout } from 'features/users/usersSlice';

function LogoutButton() {
  const dispatch = useDispatch();

  const onClick = async event => {
    event.preventDefault();
    await dispatch(logout());
  };

  return (
    <a href='#' onClick={onClick}>
      Logout
    </a>
  );
}

export { LogoutButton };
