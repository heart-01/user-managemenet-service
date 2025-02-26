import axios from 'axios';
import { IPINFO_BASE_URL } from './dotenv';

export const ipinfoAxios = axios.create({
  baseURL: IPINFO_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: '*/*' },
});
