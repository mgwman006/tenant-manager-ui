import { Form, Input } from "antd";



export default function LandlordDetailsStep(){
    return (
            <div>
               
                <Form.Item
                    name="landlordFirstName"
                    label="Landlord First Name"
                    rules={[{ required: true, message: "Please enter the landlord's first name" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="landlordLastName"
                    label="Landlord Last Name"
                    rules={[{ required: true, message: "Please enter the landlord's last name" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="landlordPhoneNumber"
                    label="Landlord Phone Number"
                    rules={[{ required: true, message: "Please enter the landlord's phone number" }]}
                >
                    <Input />
                </Form.Item>
                
            </div>
    );
}