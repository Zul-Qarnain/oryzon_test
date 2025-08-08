import ImageKit from "imagekit";
export async function GET(request: Request) {
    try {
        // Node.js SDK
        const imagekit = new ImageKit({
            publicKey: "public_LmxIJBzLIeQslPrYnQgTCr00IAc=",
            privateKey: "private_MNbkIn2tfFnd9nzNbTRVZJdKb48=",
            urlEndpoint: "https://ik.imagekit.io/oryza"
        });

        const { token, expire, signature } = imagekit.getAuthenticationParameters();
        return new Response(JSON.stringify({ token, expire, signature }), { status: 200 });

    }
    catch (error) {
        console.error("Error occurred while processing request:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}