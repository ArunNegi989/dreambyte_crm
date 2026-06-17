import React from 'react';
import { DeliveryState } from '../../types/employee/task';
import styles from '../../assets/styles/employeedashboard/DeliveryToggle.module.css';

interface DeliveryToggleProps {
  value: DeliveryState;
  onChange: (value: DeliveryState) => void;
  disabled?: boolean;
}

const DeliveryToggle: React.FC<DeliveryToggleProps> = ({ value, onChange, disabled }) => {
  const isDelivered = value === 'delivered';

  return (
    <div className={styles.toggleGroup}>
      <button
        type="button"
        className={`${styles.option} ${!isDelivered ? styles.optionActiveNotDelivered : ''}`}
        onClick={() => onChange('not_delivered')}
        disabled={disabled}
      >
        <span className={`${styles.dot} ${!isDelivered ? styles.dotNotDelivered : ''}`} />
        Not delivered
      </button>
      <button
        type="button"
        className={`${styles.option} ${isDelivered ? styles.optionActiveDelivered : ''}`}
        onClick={() => onChange('delivered')}
        disabled={disabled}
      >
        <span className={`${styles.dot} ${isDelivered ? styles.dotDelivered : ''}`} />
        Delivered
      </button>
    </div>
  );
};

export default DeliveryToggle;