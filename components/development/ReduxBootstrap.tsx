"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuthStatus, selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";
import { fetchUserProfile } from "@/store/slices/userSlice";
import { fetchSubscription } from "@/store/slices/subscription-slice";

export default function ReduxBootstrap() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  useEffect(() => {
    // Always check auth status on mount
    dispatch(checkAuthStatus() as any);
  }, [dispatch]);

  useEffect(() => {
    // If authenticated and user info available, fetch user profile and subscription
    if (isAuthenticated && user?.id) {
      dispatch(fetchUserProfile(user.id) as any);
      dispatch(fetchSubscription() as any);
    }
  }, [isAuthenticated, user, dispatch]);

  return null;
}
