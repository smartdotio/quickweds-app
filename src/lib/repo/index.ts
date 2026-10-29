import "server-only";
import { isDemo } from "../env";
import { demoRepo } from "./demo";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./types";

export const repo: Repo = isDemo ? demoRepo : supabaseRepo;
export type { Repo };
