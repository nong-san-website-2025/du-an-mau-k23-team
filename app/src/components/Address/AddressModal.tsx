import React, { useState, useEffect } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonToggle, IonLoading, IonLabel, IonFooter, IonIcon, IonNote, IonGrid, IonRow, IonCol, IonText
} from '@ionic/react';
import { 
  closeOutline, checkmarkCircleOutline, personOutline, callOutline, 
  locationOutline, mapOutline, homeOutline 
} from 'ionicons/icons';
import { useForm, Controller } from 'react-hook-form';
import { getProvinces, getDistricts, getWards } from '../../api/ghnApi';
import { Address, Province, District, Ward } from '../../types/Address';
import '../../styles/AddressModal.css'; // Giả sử bạn sẽ tạo file css riêng hoặc viết style nội bộ

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Address>) => Promise<void>;
  initialData?: Address | null;
}

interface AddressFormData {
  recipient_name: string;
  phone: string;
  province_id: number | undefined;
  district_id: number | undefined;
  ward_code: string | undefined;
  address_detail: string;
  is_default: boolean;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AddressFormData>({
    defaultValues: {
      recipient_name: '', phone: '', is_default: false,
      province_id: undefined, district_id: undefined, ward_code: undefined, address_detail: ''
    }
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedProvince = watch('province_id');
  const selectedDistrict = watch('district_id');

  // --- LOGIC GIỮ NGUYÊN ---
  useEffect(() => {
    if (isOpen) getProvinces().then(setProvinces).catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (selectedProvince) {
      getDistricts(selectedProvince).then(setDistricts);
      if (!initialData || selectedProvince !== initialData.province_id) {
        setValue('district_id', undefined);
        setValue('ward_code', undefined);
      }
    } else {
      setDistricts([]);
    }
  }, [selectedProvince, initialData, setValue]);

  useEffect(() => {
    if (selectedDistrict) {
      getWards(selectedDistrict).then(setWards);
      if (!initialData || selectedDistrict !== initialData.district_id) {
        setValue('ward_code', undefined);
      }
    } else {
      setWards([]);
    }
  }, [selectedDistrict, initialData, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        recipient_name: initialData.recipient_name,
        phone: initialData.phone,
        province_id: initialData.province_id || undefined,
        district_id: initialData.district_id || undefined,
        ward_code: initialData.ward_code || undefined,
        address_detail: initialData.location.split(',')[0], 
        is_default: initialData.is_default
      });
    } else {
      reset({ recipient_name: '', phone: '', is_default: false });
    }
  }, [initialData, isOpen, reset]);

  const onSubmit = async (data: AddressFormData) => {
    setLoading(true);
    try {
      const pName = provinces.find(p => p.ProvinceID === data.province_id)?.ProvinceName || '';
      const dName = districts.find(d => d.DistrictID === data.district_id)?.DistrictName || '';
      const wName = wards.find(w => w.WardCode === data.ward_code)?.WardName || '';
      const fullLocation = `${data.address_detail}, ${wName}, ${dName}, ${pName}`;

      const payload: Partial<Address> = {
        ...data,
        location: fullLocation,
        province_id: data.province_id || null,
        district_id: data.district_id || null,
        ward_code: data.ward_code || null,
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  // --- KẾT THÚC LOGIC ---

  // Custom Style Objects để code gọn gàng hơn
  const modalHeaderStyle = {
    '--background': '#ffffff',
    '--border-color': 'transparent', // Xóa đường kẻ dưới header mặc định
    paddingTop: '10px'
  };

  const sectionTitleStyle = {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#333',
    margin: '20px 0 10px 5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };

  // Modern Input Wrapper Class
  const modernItemClass = "modern-input-item ion-margin-bottom";

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      breakpoints={[0, 1]} 
      initialBreakpoint={1}
      className="address-modal-custom" // Class cho global CSS nếu cần
    >
      {/* 1. Header tinh tế hơn */}
      <IonHeader className="ion-no-border">
        <IonToolbar style={modalHeaderStyle}>
          <IonButtons slot="start">
            <IonButton onClick={onClose} color="medium">
              <IonIcon icon={closeOutline} size="large" />
            </IonButton>
          </IonButtons>
          <IonTitle className="ion-text-center">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {initialData ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 'normal' }}>
                Thông tin giao hàng
              </span>
            </div>
          </IonTitle>
          <IonButtons slot="end" style={{ width: '48px' }}></IonButtons> {/* Spacer để title cân giữa */}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding content-background">
        <IonLoading isOpen={loading} message={'Đang xử lý...'} spinner="crescent" />
        
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
          
          {/* SECTION 1: THÔNG TIN LIÊN HỆ */}
          <div style={sectionTitleStyle}>
            <IonIcon icon={personOutline} color="primary" /> Thông tin liên hệ
          </div>

          <IonRow>
            <IonCol size="12">
              <div className={`input-wrapper ${errors.recipient_name ? 'has-error' : ''}`}>
                <IonItem lines="none" className={modernItemClass}>
                  <IonIcon icon={personOutline} slot="start" color="medium" size="small" />
                  <IonLabel position="stacked" color="medium">Họ và tên</IonLabel>
                  <Controller name="recipient_name" control={control} rules={{ required: 'Vui lòng nhập họ tên' }}
                    render={({ field }) => (
                      <IonInput {...field} placeholder="Ví dụ: Nguyễn Văn A" onIonInput={e => field.onChange(e.detail.value)} />
                    )}
                  />
                </IonItem>
                {errors.recipient_name && <p className="error-text">{errors.recipient_name.message}</p>}
              </div>
            </IonCol>

            <IonCol size="12">
              <div className={`input-wrapper ${errors.phone ? 'has-error' : ''}`}>
                <IonItem lines="none" className={modernItemClass}>
                  <IonIcon icon={callOutline} slot="start" color="medium" size="small" />
                  <IonLabel position="stacked" color="medium">Số điện thoại</IonLabel>
                  <Controller name="phone" control={control} rules={{ required: 'Vui lòng nhập SĐT', pattern: { value: /^[0-9]{10}$/, message: 'SĐT không hợp lệ (10 số)' } }}
                    render={({ field }) => (
                      <IonInput {...field} type="tel" placeholder="09xx xxx xxx" onIonInput={e => field.onChange(e.detail.value)} />
                    )}
                  />
                </IonItem>
                {errors.phone && <p className="error-text">{errors.phone.message}</p>}
              </div>
            </IonCol>
          </IonRow>

          {/* SECTION 2: ĐỊA CHỈ */}
          <div style={sectionTitleStyle}>
            <IonIcon icon={mapOutline} color="primary" /> Địa chỉ nhận hàng
          </div>

          <div className="address-group-box">
             {/* Tỉnh/Thành */}
            <div className={`input-wrapper ${!selectedProvince ? '' : ''}`}>
               <IonItem lines="full" className="modern-select-item">
                <IonLabel position="stacked" color="medium">Tỉnh / Thành phố</IonLabel>
                <Controller name="province_id" control={control} rules={{ required: true }}
                  render={({ field }) => (
                    <IonSelect 
                      value={field.value} 
                      placeholder="Chọn Tỉnh/Thành" 
                      interface="action-sheet" // UX: Dễ dùng hơn trên mobile
                      cancelText="Hủy"
                      onIonChange={e => field.onChange(e.detail.value)}
                    >
                      {provinces.map(p => <IonSelectOption key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</IonSelectOption>)}
                    </IonSelect>
                  )}
                />
              </IonItem>
            </div>

            <IonRow>
              <IonCol size="6" style={{ paddingRight: '5px' }}>
                <IonItem lines="full" className="modern-select-item">
                  <IonLabel position="stacked" color="medium">Quận / Huyện</IonLabel>
                  <Controller name="district_id" control={control} rules={{ required: true }}
                    render={({ field }) => (
                      <IonSelect 
                        value={field.value} 
                        placeholder="Chọn Quận" 
                        disabled={!selectedProvince} 
                        interface="action-sheet"
                        cancelText="Hủy"
                        onIonChange={e => field.onChange(e.detail.value)}
                      >
                        {districts.map(d => <IonSelectOption key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</IonSelectOption>)}
                      </IonSelect>
                    )}
                  />
                </IonItem>
              </IonCol>

              <IonCol size="6" style={{ paddingLeft: '5px' }}>
                <IonItem lines="none" className="modern-select-item">
                  <IonLabel position="stacked" color="medium">Phường / Xã</IonLabel>
                  <Controller name="ward_code" control={control} rules={{ required: true }}
                    render={({ field }) => (
                      <IonSelect 
                        value={field.value} 
                        placeholder="Chọn Phường" 
                        disabled={!selectedDistrict} 
                        interface="action-sheet"
                        cancelText="Hủy"
                        onIonChange={e => field.onChange(e.detail.value)}
                      >
                        {wards.map(w => <IonSelectOption key={w.WardCode} value={w.WardCode}>{w.WardName}</IonSelectOption>)}
                      </IonSelect>
                    )}
                  />
                </IonItem>
              </IonCol>
            </IonRow>
          </div>
          {(errors.province_id || errors.district_id || errors.ward_code) && (
            <IonText color="danger" style={{ fontSize: '0.8rem', marginLeft: '10px' }}>
              * Vui lòng chọn đầy đủ Tỉnh, Huyện, Xã
            </IonText>
          )}

          {/* Địa chỉ chi tiết */}
          <div className="input-wrapper" style={{ marginTop: '16px' }}>
            <IonItem lines="none" className={modernItemClass} style={{ alignItems: 'flex-start' }}>
              <IonIcon icon={locationOutline} slot="start" color="medium" size="small" style={{ marginTop: '12px' }} />
              <IonLabel position="stacked" color="medium">Số nhà, Tên đường</IonLabel>
              <Controller name="address_detail" control={control} rules={{ required: true }}
                render={({ field }) => (
                  <IonTextarea {...field} placeholder="Ví dụ: 123 Đường Nguyễn Huệ..." rows={3} onIonInput={e => field.onChange(e.detail.value)} />
                )}
              />
            </IonItem>
             {errors.address_detail && <p className="error-text">Vui lòng nhập địa chỉ cụ thể</p>}
          </div>

          {/* SECTION 3: CÀI ĐẶT */}
          <div className="setting-card ion-margin-top">
            <IonItem lines="none" style={{ '--background': 'transparent' }}>
              <IonIcon icon={homeOutline} slot="start" color={watch('is_default') ? 'primary' : 'medium'} />
              <IonLabel>
                <h3 style={{ fontWeight: 600 }}>Đặt làm địa chỉ mặc định</h3>
                <p style={{ fontSize: '0.8rem', color: '#888' }}>Sử dụng địa chỉ này cho các đơn hàng sau</p>
              </IonLabel>
              <Controller name="is_default" control={control}
                render={({ field }) => (
                  <IonToggle checked={field.value} onIonChange={e => field.onChange(e.detail.checked)} color="primary" />
                )}
              />
            </IonItem>
          </div>

        </div>
      </IonContent>

      <IonFooter className="ion-no-border" style={{ backgroundColor: '#fff' }}>
        <div className="ion-padding">
          <IonButton 
            expand="block" 
            shape="round" 
            onClick={handleSubmit(onSubmit)} 
            style={{ 
              height: '52px', 
              fontSize: '1.05rem', 
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3)',
              "--background": "#2E7D32",
            }}
          >
            <IonIcon slot="start" icon={checkmarkCircleOutline} />
            {initialData ? 'Lưu thay đổi' : 'Hoàn tất'}
          </IonButton>
        </div>
      </IonFooter>

      {/* INLINE CSS CHO NHANH, BẠN NÊN CHUYỂN VÀO FILE CSS */}
      
    </IonModal>
  );
};

export default AddressModal;