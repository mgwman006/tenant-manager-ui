import { Button, Col, Flex, Form, notification, Result, Row, Steps } from "antd";
import PropertyDetailsStep from "./createleasesteps/PropertyDetailsStep";
import RentDetailsStep from "./createleasesteps/RentDetailsStep";
import ReviewStep from "./createleasesteps/ReviewStep";
import TermsStep from "./createleasesteps/TermsStep";
import { LeaseCreateDTO, LeaseDetailsDTO } from "../../models/lease";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../store/account/AccountContext";
import { createLease } from "../../services/leaseService";
import { PlusOutlined, MoreOutlined, RightOutlined, LeftOutlined } from "@ant-design/icons";
import { TenantDetailsDTO } from "../../models/user";
import LandlordDetailsStep from "./createleasesteps/LandlordDetailsStep";
import { useTenant } from "../../store/tenant/TenantContext";


const authUrl = import.meta.env.VITE_AUTH_URL?.trim();
const tenantManagerUrl = import.meta.env.VITE_TENANT_MANAGER_URL?.trim();

export default function(){
    const navigate = useNavigate();
    const [leaseForm] = Form.useForm<LeaseCreateDTO>();
    const [createLeaseStep, setCreateLeaseStep] = useState(0);
    const [notificationApi, contextHolder] = notification.useNotification();
    const { accountState } = useAccount();
    const token = accountState.accountDetails?.token ?? "";
    const [lease,setLease] = useState<LeaseDetailsDTO>();
    const { tenantState } = useTenant();
    
    

    
    
    const stepItems = [
        { 
            title: "Tenant Details" 
        },
        { title: "Property Details" },
        { title: "Rent Details" },
        { title: "Terms" },
        { 
            title: "Review" 

        },
        { 
            title: "Results" 
        },
    ]


    const navigateToAuth = (nextApp: string = "tenant-manager", phone?: string) => {
        if (!authUrl) {
            notificationApi.error({
            message: "Error while reading url",
            description: "VITE_AUTH_URL is not configured.",
            });
            return;
        }

        const outGoingUrlValue = nextApp === "tenant-manager" ? tenantManagerUrl : null;
        if (!outGoingUrlValue) {
            console.error("Unable to resolve outgoing URL for auth redirect.");
            return;
        }

        const url = `${authUrl}?outGoingUrl=${encodeURIComponent(outGoingUrlValue)}&phoneNumber=${encodeURIComponent("")}`;
        window.location.href = url;
    };

    const handleCreateLease = async () => {
            const tenantId = tenantState.tenantDetails?.id;
            const token = accountState.accountDetails?.token;
            if (!token) {
                notificationApi.error({
                    message: "Tenant Id or Token is not valid",
                    description: "Please sign in again to create a lease.",
                });
                navigateToAuth("tenant-manager",tenantState.tenantDetails?.phoneNumber)
                return;
            }

            if (!tenantId) {
                notificationApi.error({
                    message: "Tenant Id is valid",
                    description: `The recoded value is ${tenantId}`,
                });
                return;
            }

        
            const values = leaseForm.getFieldsValue(true) as LeaseCreateDTO;
            const payload: LeaseCreateDTO = {
                        ...values,
                        tenantId: tenantId,
                        rentalProfileId:0,
                        rent: {
                            ...values.rent,
                            id: !values.rent.id ? 0 : values.rent.id,
                            currency: "TZS",
                        },
            };
        
    
            const response = await createLease(payload, token,notificationApi);
            setCreateLeaseStep((step) => step + 1);
    };
        
     

    const goToNextCreateLeaseStep = async () => {
        const fieldsByStep = [
            ["tenantFirstName", "tenantLastName", "tenantPhoneNumber"],
            ["unitId"],
            [
                ["rent", "amount"],
                ["rent", "currency"],
                ["rent", "frequency"],
            ],
            ["startDate", "endDate", "fullLeasePaymentRequired"],
        ];

        try {
            await leaseForm.validateFields(fieldsByStep[createLeaseStep]);
            setCreateLeaseStep((step) => step + 1);
        } catch {
            notificationApi.error({
                message: "Error to during form filling",
                description: "Make sure all files are filled",
            });
        }
    };

    return (
        <div>
            {contextHolder}
            <Flex vertical gap={'large'}>
                <Steps
                    current={createLeaseStep}
                    items={stepItems}
                />

                <Form
                    size="large"
                    form={leaseForm}
                    layout="vertical"
                    onFinish={handleCreateLease}
                >
                    <div className="mt-6">
                    {createLeaseStep === 0 && (
                        <LandlordDetailsStep />
                    )}

                    {createLeaseStep === 1 && (
                        <PropertyDetailsStep />
                    )}

                    {createLeaseStep === 2 && (
                        <RentDetailsStep />
                    )}

                    {createLeaseStep === 3 && (
                        <TermsStep/>
                    )}

                    {createLeaseStep === 4 && (
                        <ReviewStep leaseForm={leaseForm} />
                    )}

                    {createLeaseStep === 5 && (
                        <Result
                            status="success"
                            title="Successfully Created a Lease"
                            subTitle={`Lease Reference Number: ${lease?.referenceNumber}.`}
                            extra={[
                                <Button onClick={()=> navigate(-1)} type="primary" key="console">
                                    Go to List
                                </Button>
                            ]}
                        />
                    )}
                </div>
                    
                        
                </Form>

                <Row justify="space-between">
                        <Col>
                            {createLeaseStep > 0 && createLeaseStep<5 && (
                                <Button size="large" onClick={() => setCreateLeaseStep((step) => step - 1)}>
                                   <LeftOutlined /> Back
                                </Button>
                            )}
                        </Col>
                        <Col>
                            {createLeaseStep < 4 ? (
                                <Button size="large" type="primary" onClick={goToNextCreateLeaseStep}>
                                    Next <RightOutlined />
                                </Button>
                            ) : createLeaseStep <5 ? (
                                <Button
                                    size="large"
                                    type="primary"
                                    onClick={() => leaseForm.submit()}
                                >
                                    Create Lease
                                </Button>
                            ):(<div></div>)}
                        </Col>
                </Row>

            </Flex>
        </div>
    );
}
