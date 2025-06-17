import React from "react";
import { ThemedLayoutV2 } from "@refinedev/antd";
import { Header } from "@components/header";

export default async function Layout({ children }: React.PropsWithChildren) {
  return <ThemedLayoutV2 Header={Header}>{children}</ThemedLayoutV2>;
}
