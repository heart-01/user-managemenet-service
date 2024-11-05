export type ResponseCommonType<t = any> = {
  status: number;
  data: t;
};
