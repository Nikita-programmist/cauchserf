import type { Key } from 'react';

type MutateOptions = {
  revalidate?: boolean;
};

type SWRResponse<Data = any, Error = any> = {
  data: Data | undefined;
  error: Error | undefined;
  isValidating: boolean;
  mutate: (
    data?: Data | Promise<Data> | ((current: Data | undefined) => Data | undefined),
    opts?: MutateOptions
  ) => Promise<void> | void;
};

export default function useSWR<Data = any, Error = any>(
  key: any,
  fetcher: (key: any) => Promise<Data> | Data,
  options?: Record<string, unknown>
): SWRResponse<Data, Error>;
