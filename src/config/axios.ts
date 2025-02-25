import axios from 'axios';

export const ipinfoAxios = axios.create({
  baseURL: `https://ipinfo.io`,
  headers: { 'Content-Type': 'application/json', Accept: '*/*' },
});
