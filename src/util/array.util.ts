export const arrayUnique = <TItem = unknown>(items: TItem[]): TItem[] => {
  return items.filter((item, index, array) => array.indexOf(item) === index);
};
