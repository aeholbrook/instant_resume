export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div
      className="prose prose-neutral max-w-none prose-img:rounded-none prose-a:text-neutral-900 prose-a:underline-offset-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}