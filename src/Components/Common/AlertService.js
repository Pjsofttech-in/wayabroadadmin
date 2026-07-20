// src/services/AlertService.js
import Swal from 'sweetalert2';
import './AlertZIndex.css';

const AlertService = {
  success: (message) => {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      confirmButtonColor: '#3085d6',
      customClass: { container: 'swal2-z-top' },
    });
  },

  error: (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: message,
      confirmButtonColor: '#d33',
      customClass: { container: 'swal2-z-top' },
    });
  },

  confirm: async (message) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes!',
      customClass: { container: 'swal2-z-top' },
    });
    return result.isConfirmed;
  },
};

export default AlertService;
