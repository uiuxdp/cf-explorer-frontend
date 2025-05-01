
import qs from "qs";
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        // Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
    },
    next: {
        revalidate: 60 * 60 * 24, // data will be cached for 1 day
    }
};




const strapiFetch = async (slug, urlParamsObject) => {

    const queryString = qs.stringify(urlParamsObject);
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}${slug}${queryString ? `?${queryString}` : ""}`,
        { options }
    );
    
    console.log(`${process.env.NEXT_PUBLIC_BASE_URL}${slug}${queryString ? `?${queryString}` : ""}`,"link");

    if (!res.ok) {
        return undefined;
    }

    return res.json();
};

export default strapiFetch;

