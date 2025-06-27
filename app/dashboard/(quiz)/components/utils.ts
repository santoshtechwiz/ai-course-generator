import { use } from "react";

export const getQuizSlug  = 
(params: Promise<{ slug: string }> ) => {
 const {slug}=use(params);
 return slug;
}
