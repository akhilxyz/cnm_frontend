import { http } from ".";



export  const AdminApi = {
   // 🟩 Get user list
  userList: async (page = 1, limit = 10, search = "") => {
    const res = await http.get("/admin/users/list", {
      params: { page, limit, search },
    });
    return res.data;
  },

  // 🟩 Create new user
  createUser: async (data: any) => {
    const res = await http.post("/admin/users/create", data);
    return res.data;
  },

  // 🟩 Update existing user
  updateUser: async (id: number, data: any) => {
    const res = await http.put(`/admin/users/${id}`, data);
    return res.data;
  },

  // 🟩 Delete user
  deleteUser: async (id: number) => {
    const res = await http.delete(`/admin/users/${id}`);
    return res.data;
  },

}