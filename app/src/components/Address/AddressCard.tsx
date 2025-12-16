import React, { useRef } from 'react';
import { 
  IonItemSliding, IonItem, IonLabel, IonItemOptions, 
  IonItemOption, IonIcon, IonButton
} from '@ionic/react';
import { 
  createOutline, trashOutline, checkmarkCircleOutline, 
  locationOutline, callOutline 
} from 'ionicons/icons';
import { Address } from '../../types/Address';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onEdit, onDelete, onSetDefault }) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);

  // Helper để đóng slide sau khi bấm nút
  const closeSlide = () => {
    slidingRef.current?.close();
  };

  return (
    <IonItemSliding ref={slidingRef} className="address-card-sliding">
      
      {/* VUỐT PHẢI: Đặt mặc định */}
      {!address.is_default && (
        <IonItemOptions side="start">
          <IonItemOption color="success" onClick={() => { onSetDefault(address.id); closeSlide(); }}>
            <IonIcon slot="top" icon={checkmarkCircleOutline} />
            Mặc định
          </IonItemOption>
        </IonItemOptions>
      )}

      {/* CARD CONTENT CHÍNH */}
      <IonItem lines="none" detail={false} className="address-item-inner">
        <IonLabel className="ion-text-wrap">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span className="addr-name">{address.recipient_name}</span>
            {address.is_default && <span className="badge-default">Mặc định</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#555' }}>
            <IonIcon icon={callOutline} size="small" />
            <span className="addr-phone">{address.phone}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#666' }}>
            <IonIcon icon={locationOutline} size="small" style={{marginTop: '2px'}} />
            <span className="addr-detail">{address.location}</span>
          </div>
        </IonLabel>

        {/* Nút Edit nổi bật ngay trên card */}
        <IonButton fill="clear" color="primary" onClick={(e) => { e.stopPropagation(); onEdit(address); }}>
          <IonIcon slot="icon-only" icon={createOutline} />
        </IonButton>
      </IonItem>

      {/* VUỐT TRÁI: Xóa */}
      <IonItemOptions side="end">
        <IonItemOption color="danger" onClick={() => { onDelete(address.id); closeSlide(); }}>
          <IonIcon slot="top" icon={trashOutline} />
          Xóa
        </IonItemOption>
      </IonItemOptions>

    </IonItemSliding>
  );
};

export default AddressCard;