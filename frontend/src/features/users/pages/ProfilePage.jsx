import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import { loadUserDetails, selectUserById } from '../usersSlice';

// TODO: handle case where invalid user ID is passed.
function ProfilePage() {
  const dispatch = useDispatch();
  const { userId } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector(state => selectUserById(state, userId));

  useEffect(async () => {
    if (!user) {
      setIsLoading(true);
      await dispatch(loadUserDetails(userId));
      setIsLoading(false);
    }
  }, [userId]);

  return (
    <div>
      <div>
        <Link to='/'>Home</Link>
      </div>

      {(user && !isLoading) ? (
        <>
          <div>id: {userId}</div>
          <div>username: {user.username}</div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export { ProfilePage };
