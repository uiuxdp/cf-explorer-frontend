
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
  },
  next: {
    revalidate: 60 * 60 * 24, // data will be cached for 1 day
  }
};

const nextFetch = async (slug) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}${slug}`,
    { options }
  );

  console.log(`${process.env.NEXT_PUBLIC_BASE_URL}${slug}`);

  if (!res.ok) {
    return undefined;
  }

  return res.json();
};

export default nextFetch;
