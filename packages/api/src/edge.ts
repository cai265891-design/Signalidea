import { authRouter } from "./router/auth";
import { customerRouter } from "./router/customer";
import { helloRouter } from "./router/health_check";
import { k8sRouter } from "./router/k8s";
import { n8nRouter } from "./router/n8n";
import { stripeRouter } from "./router/stripe";
import { createTRPCRouter } from "./trpc";

export const edgeRouter = createTRPCRouter({
  stripe: stripeRouter,
  hello: helloRouter,
  k8s: k8sRouter,
  auth: authRouter,
  customer: customerRouter,
  n8n: n8nRouter,
});
