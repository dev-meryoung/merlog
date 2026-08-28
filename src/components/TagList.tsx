import Tag from './Tag';

interface TagListProps {
  allTags: string[];
  selectedTag?: string;
}

const TagList: React.FC<TagListProps> = ({ allTags, selectedTag }) => (
  <div className='py-5'>
    <h2 className='inline font-recipekorea text-2xl md:text-3xl font-bold dark:text-text-dark'>
      TAGS
    </h2>
    {allTags.length > 0 ? (
      <div className='flex my-4 p-3 md:p-4 gap-1.5 md:gap-2 flex-wrap shadow-md bg-white rounded-lg dark:bg-darkActive'>
        {allTags.map((tag) => (
          <Tag key={tag} label={tag} isActive={tag === selectedTag} />
        ))}
      </div>
    ) : (
      <div className='flex justify-center my-4 p-4 md:p-6 shadow-md bg-white rounded-lg dark:bg-darkActive dark:text-text-dark'>
        등록된 태그가 없습니다.
      </div>
    )}
  </div>
);

export default TagList;
