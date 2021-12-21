// let ori = `
// | SET_HOSPITAl_SETTING_CONFIG | hospitalSettingConfig | setHospSetting && saveRecipeJurisdiction | apiGetRecipeJurisdiction && /user-auth/hospital/setting | 获取医院设置信息 |,
// | GET_BILLRECORD_LIST | billRecordList | getBillRecordList && getBillPayMentPage | apiGetBillPayMentPage && api/bill/payment/page | 获取账单列表 |,
// | ADDRESS | addressOptions | actionAddress | apiFetchAddress && /common/area/list | 获取地址 |,
// | UPDATE_MEDICARE_CONF | updateMedicareConfData | updateMedicareConf &&  addMedicareConf | apiAddMedicareConf && apiUpdateMedicareConf && /common/medicare-conf && [接口文档](http://yapi.guahao.cn/project/2656/interface/api/61249) | 添加 && 修改医保配置 |,
// | GET_MEDICARE_CONF | getMedicareConfData | getMedicareConf | apiGetMedicareConf && /common/medicare-conf/list/conf | 获取医院配置 |,
// | SET_MEDICARE_CONF | setMedicareConfData | setMedicareConf | 无（由Action-setMedicareConf 直接将参数赋值给setMedicareConfData） | 医保配置 |,
// | GET_STAFF_LIST | staffList | getStaffList | apiGetStaffList && /basic/staff/list | 根据不同传参获取人员列表 |,
// | charge/GET_PAYMENT_OBJ | paymentObj | getPaymentData | apiGetPaymentData / /bill/payment/base/\\${params} | 支付记录数据 |,
// | charge/GET_PAY_MENT | payMentDetail | getBillPayMentDetail && getSelfUnpaidPay | apiGetBillPayMentDetail / /bill/payment/\\${params.id} && apiGetSelfUnpaidPay / /bill/charge/getSelfUnpaidPay/\\${params} | 支付记录详情 && 自费挂账为付款账单 |,
// | drugmanage/GET_MEDICAREINSURANCECONF_LIST | medicareInsuranceConfList | getMedicareInsuranceConfList | apiGetMedicareInsuranceConfList && /common/medicare-conf/list | 获取医院医保列表                                      |,
// | branchHospital/GET_HOSPITAL_DETAIL        | hospitalDetailObj         | getHospitalDetail            | /user-auth/hospital/info/\\${params}                           | 医院设置（查询与设置）                                |,
// | payservice/GET_FEE_DETAIL                 | getFeeDetailData          | getFeeDetail                 | apiGetFeeDetail && /common/fee-item-hosp/\\${params}           | 查看收费详情                                          |,
// | clinic/GET_FREQUENCY_LIST                 | drugFrequencyValue        | getFrequencyList             | apiGetFrequencyList && /common/frequency/list-all            | 频次列表                                              |,
// | clinic/ClINIC_PATIENTS                    | clinicPatients            | getClinicPatients            | apiGetClinicPatients && /clinic/visit/page                   | 获取就诊患者列表                                      |,
// | patient/SET_DIAGNOSIS_RECORD              | diagnosisRecordList       | getDiagnosisRecord           | apiGetDiagnosisRecord && /healthcare/patient/diagnosisrecord | 诊疗记录                                              |,
// | GET_ISMATCH_LIST                          | isMatchList               | getIsMatch                   | apiGetIsMatch && /clinic/visit/medicare/list/doctor/\\${params} | 校验选中的医生与医保是否匹配 && 存储的是medicareAppId |,
// | medical-insurance/GET_MEDICAREREAL_LIST   | medicareRealList          | 查询药品/耗材                | apiGetMedicareRealList && /pharmacy/medicare/queryMedicareRealPage |                                                       |,
// | charge/SET_MEDICARE_APPS                  | medicareApps              | insuranceSigns               | apiInsuranceSigns && /bill/medicare/sign-statuses            | 获取员工签到列表                                      |,
// | charge/GET_INSUANCE_PATIENT_OBJ  | insurancePatientObj  | getInsurancePatientJN                | apiGetInsurancePatientJN && /bill/medicare/getPatient        | 济南市医保获取患者信息     |,
// | charge/SET_RIGHT_CALCULAT_RIGHTS | rightsCalculatRights | getCalculatRights                    | apiGetCalculatRights && /bill/rights/calculatRights          | 优惠计算                   |,
// | charge/GET_REFUND_DETAIL         | refundDetail         | getRefundDetail                      | apiGetRefundDetail && /bill/payment/refund/\\${params}         | 获取退费详情               |,
// | charge/GET_SET_STATEMENT         | setStatement         | getSetStatement                      | apiSetStatement && /bill/settlement/preview                  | 获取结账管理生成结账单预览 |,
// | ADD_ACCOUNT                      | account              | setHospId                            | apiHospSwitch && /user-auth/external/hosp-switch?hospStdId=&sourceId= | 设置机构id && 切换机构id   |,
// | SET_PATIENT_ITEM                 | patientItem          | getPatientItem && getPatientItemNoId | apiGetPatientItem && /patient/\\${params}                      | 患者详情                   |,
// | doctor-advice/GET_BARCODEO_OBJ   | barcodeObj           | getBarcode                           | apiGetBarcode && /clinic/medical-tech/lis/barcode            | 查询条形码并获取打印信息   |,
// | GET_INSPECTIONCHECKLIST          | inspectionCheckList  | getInspectionCheckList               | apiGetInspectionCheckList && /clinic/doctor-advice/medical-tech/page | 检验列表                   |,
// | physical/GET_TREATMENTLIST       | treatmenItemtList    | getTreatmentList                     | apiGetTreatmentList && /physical-exam/treatment-item/list    | 获取检验和检查项目列表     |
// `


let ori = `
| charge/GET_CHARGE_DETAIL &&  GET_CHARGE_DETAIL && GET_CHARGE_DETAIL_STAYPAY | baseInfoObj && chargeDetail && chargeDetailStayPay | getChargeDetailStayPay | apiGetChargeDetailStayPay && /bill/charge/staypay/\${params}?t=\${Date.now()} | 待支付账单详情-防止浏览器缓存：账单基本信息 && 详情本身&&详情本身 |,
| charge/GET_PAY_TYPES                                         | payTypes                                           | getPayTypeList         | apiGetPayTypeList && /bill/charge/payTypeList/\${params}      | 获取结算方式                                                 |,
| charge/GET_CHARGE_DETAIL && GET_CHARGE_DETAIL_STAYPAY        | chargeDetail && chargeDetailStayPay                | getStayPayByPayType    | apiGetStayPayByPayType && /bill/charge/getStayPayByPayType/\${params.billId}/\${params.payType} | 根据结算方式获取最新收费账单信息                             |
`
module.exports = ori;