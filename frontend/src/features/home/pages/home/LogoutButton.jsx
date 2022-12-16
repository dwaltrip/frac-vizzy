import React, { useEffect, useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { logout, selectToken } from '../../../users/usersSlice';


function LogoutButton() {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);

  const onClick = async event => {
    event.preventDefault();
    await dispatch(logout(token));
  };

  return (
    <a href='#' onClick={onClick}>
      Logout
    </a>
  );
}

export { LogoutButton };
