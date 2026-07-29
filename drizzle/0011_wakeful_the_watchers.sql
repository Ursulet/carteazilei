DROP INDEX "product_events_dedupe_key_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "product_events_dedupe_key_unique" ON "product_events" USING btree ("dedupe_key");