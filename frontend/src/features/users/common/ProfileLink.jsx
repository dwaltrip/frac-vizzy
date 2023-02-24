import React from 'react';
import { Link } from 'react-router-dom';

const ProfileLink = ({ user }) => (
  <Link to={`/profile/${user.id}`}>
    {user.username}
  </Link>
);

export { ProfileLink };
