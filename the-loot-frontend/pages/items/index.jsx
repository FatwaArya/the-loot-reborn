import Image from "next/image";
export default function Items({datas}){
    //convert buffer to base64
    const convertToBase64 = (buffer) => {
        return Buffer.from(buffer).toString('base64');
    }
    return (
        <div className="items">
            {datas.map(data => (
                <div className="item" key={data.id}>
                    <div className="item-image">
                        <img src={`data:image/png;base64,${convertToBase64(data.image)}`} alt={data.name} />
                    </div>
                    <div className="item-name">{data.itemName}</div>
                    <div className="item-price">{data.price}</div>
                    {data.status}
                </div>
            ))}
        </div>
    )
}

export async function getServerSideProps(context){
     const res = await fetch('http://localhost:8080/items/all');
     const data = await res.json();

     return {
          props: {
                datas: data
          }
     }
}