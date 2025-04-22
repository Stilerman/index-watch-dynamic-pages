
import { UrlGroup } from "@/types";

export function useGroupUtils(groups: UrlGroup[]) {
  const getGroupName = (url: string): string => {
    for (const group of groups) {
      if (group.urls.includes(url)) {
        return group.name;
      }
    }
    return "Без группы";
  };

  const getUrlGroup = (url: string): UrlGroup | undefined => {
    return groups.find(group => group.urls.includes(url));
  };

  return {
    getGroupName,
    getUrlGroup
  };
}
