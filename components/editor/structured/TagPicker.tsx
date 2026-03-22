'use client';

type Props = {
  allTags: string[];
  activeTags: string[];
  onChange: (tags: string[]) => void;
};

export default function TagPicker({ allTags, activeTags, onChange }: Props) {
  if (allTags.length === 0) return null;

  const activeSet = new Set(activeTags);

  const toggle = (tag: string) => {
    if (activeSet.has(tag)) {
      onChange(activeTags.filter((t) => t !== tag));
    } else {
      onChange([...activeTags, tag]);
    }
  };

  return (
    <div className="tag-picker">
      {allTags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`tag-chip ${activeSet.has(tag) ? 'active' : ''}`}
          onClick={() => toggle(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
