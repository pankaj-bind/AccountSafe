// src/services/pinService.ts
import apiClient from '../api/apiClient';

export const setupPin = async (pin: string) => {
  const response = await apiClient.post('/pin/setup/', { pin });
  return response.data;
};

export const verifyPin = async (pin: string) => {
  const response = await apiClient.post('/pin/verify/', { pin });
  return response.data;
};

export const getPinStatus = async () => {
  const response = await apiClient.get('/pin/status/');
  return response.data;
};

export const resetPin = async (email: string, otp: string, newPin: string) => {
  const response = await apiClient.post('/pin/reset/', { 
    email, 
    otp, 
    new_pin: newPin 
  });
  return response.data;
};
