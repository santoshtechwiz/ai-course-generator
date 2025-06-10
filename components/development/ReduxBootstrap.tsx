"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "@/store/slices/auth-slice";
import { fetchUserProfile } from "@/store/slices/user-slice";
import { fetchSubscription } from "@/store/slices/subscription-slice";
import { useSession } from "next-auth/react"; // Import useSession

export default function ReduxBootstrap() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const { status, data: session } = useSession(); // Use useSession hook

  // Initialize auth state from session
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Ensure Redux auth state is updated with session data
      dispatch({
        type: "auth/loginSuccess",
        payload: {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            isAdmin: session.user.isAdmin || false,
            credits: session.user.credits || 0,
            userType: session.user.userType || 'FREE'
          },
          token: session.user.accessToken || null
        }
      });
    }
  }, [status, session, dispatch]);

  useEffect(() => {
    // Only fetch data when session is fully loaded
    if (status === "authenticated" && user?.id) {
      dispatch(fetchUserProfile(user.id) as any);
      dispatch(fetchSubscription() as any);
    }
  }, [status, user, dispatch]);

  return null;
}
