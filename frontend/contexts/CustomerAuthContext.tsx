"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as customerAuthApi from "@/lib/api/customer/auth";
import {
  clearCustomerToken,
  getCustomerToken,
  getStoredCustomer,
  setCustomerToken,
  setStoredCustomer,
} from "@/lib/auth/customer-token";
import { ApiError } from "@/lib/api/errors";
import type {
  Customer,
  CustomerLoginRequest,
  CustomerRegisterRequest,
} from "@/types/customer/auth";

type CustomerAuthContextValue = {
  customer: Customer | null;
  isLoading: boolean;
  login: (payload: CustomerLoginRequest) => Promise<Customer>;
  register: (payload: CustomerRegisterRequest) => Promise<Customer>;
  logout: () => void;
  refreshCustomer: () => Promise<Customer | null>;
  setSession: (accessToken: string, nextCustomer: Customer) => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((accessToken: string, nextCustomer: Customer) => {
    setCustomerToken(accessToken);
    setStoredCustomer(nextCustomer);
    setCustomer(nextCustomer);
  }, []);

  const refreshCustomer = useCallback(async (): Promise<Customer | null> => {
    const token = getCustomerToken();
    if (!token) {
      setCustomer(null);
      return null;
    }
    try {
      const me = await customerAuthApi.getMe();
      setStoredCustomer(me);
      setCustomer(me);
      return me;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearCustomerToken();
        setCustomer(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    const cached = getStoredCustomer();
    if (cached) setCustomer(cached);
    void refreshCustomer().finally(() => setIsLoading(false));
  }, [refreshCustomer]);

  const login = useCallback(
    async (payload: CustomerLoginRequest) => {
      const data = await customerAuthApi.login(payload);
      setSession(data.access_token, data.customer);
      return data.customer;
    },
    [setSession],
  );

  const register = useCallback(
    async (payload: CustomerRegisterRequest) => {
      const data = await customerAuthApi.register(payload);
      setSession(data.access_token, data.customer);
      return data.customer;
    },
    [setSession],
  );

  const logout = useCallback(() => {
    clearCustomerToken();
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      isLoading,
      login,
      register,
      logout,
      refreshCustomer,
      setSession,
    }),
    [customer, isLoading, login, register, logout, refreshCustomer, setSession],
  );

  return (
    <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return ctx;
}
