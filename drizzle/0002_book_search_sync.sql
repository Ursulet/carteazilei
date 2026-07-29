CREATE OR REPLACE FUNCTION sync_book_search_document()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  author_name_value text;
BEGIN
  SELECT name
  INTO author_name_value
  FROM authors
  WHERE id = NEW.primary_author_id;

  NEW.search_text := lower(
    unaccent(
      concat_ws(
        ' ',
        NEW.title,
        NEW.subtitle,
        NEW.original_title,
        author_name_value
      )
    )
  );

  NEW.search_document :=
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(author_name_value, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.subtitle, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.original_title, ''))), 'B');

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER books_search_document_sync
BEFORE INSERT OR UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION sync_book_search_document();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION refresh_books_after_author_name_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE books
  SET updated_at = now()
  WHERE primary_author_id = NEW.id;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER authors_refresh_book_search
AFTER UPDATE OF name ON authors
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION refresh_books_after_author_name_change();
--> statement-breakpoint
UPDATE books SET updated_at = updated_at;
