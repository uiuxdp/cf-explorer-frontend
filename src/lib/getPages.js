import strapiFetch from "@/utils/strapiFetch";
import { FEEDBACK_ITEMS } from "./constants";



export async function getSingleFeedback(slug) {
    const url = `${FEEDBACK_ITEMS}/${slug}`
    const urlParamsObject = {
        populate: "source",
    };
    const data = await strapiFetch(url, urlParamsObject);
    return data;
}
