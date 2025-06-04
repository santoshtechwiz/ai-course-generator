"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";
import { fetchUserProfile } from "@/store/slices/userSlice";
import { fetchSubscription } from "@/store/slices/subscription-slice";
import { useSession } from "next-auth/react"; // Import useSession

export default function ReduxBootstrap() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const { status } = useSession(); // Use useSession hook

  useEffect(() => {
    // Only fetch data when session is fully loaded
    if (status === "authenticated" && user?.id) {
      dispatch(fetchUserProfile(user.id) as any);
      dispatch(fetchSubscription() as any);
    }
  }, [status, user, dispatch]);

  return null;
}
