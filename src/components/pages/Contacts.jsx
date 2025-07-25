import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Avatar from "@/components/atoms/Avatar";
import SearchBar from "@/components/molecules/SearchBar";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import { getContacts, updateContact } from "@/services/api/contactsService";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const data = await getContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (err) {
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
if (searchTerm) {
      const filtered = contacts.filter(contact =>
        (contact.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.email_c || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.company_c || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);

const handleStatusChange = async (contactId, newStatus) => {
    try {
      await updateContact(contactId, { status_c: newStatus });
      const updatedContacts = contacts.map(contact =>
        contact.Id === contactId ? { ...contact, status_c: newStatus } : contact
      );
      setContacts(updatedContacts);
      toast.success("Contact status updated successfully");
    } catch (err) {
      toast.error("Failed to update contact status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "New": "default",
      "Contacted": "info",
      "Qualified": "primary",
      "Unqualified": "error",
      "Customer": "success"
    };
    return colors[status] || "default";
  };

  if (loading) return <Loading type="table" />;
  if (error) return <Error message={error} onRetry={loadContacts} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your leads and customer contacts</p>
        </div>
        <Button>
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Add Contact
        </Button>
      </div>

      <SearchBar
        placeholder="Search contacts..."
        onSearch={setSearchTerm}
        showFilter={true}
        onFilter={() => toast.info("Filter functionality coming soon")}
      />

      {filteredContacts.length === 0 ? (
        <Empty
          title="No contacts found"
          description="Start building your contact list by adding your first lead"
          actionText="Add Contact"
          icon="Users"
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Company</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Assigned Rep</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map((contact, index) => (
                  <motion.tr
                    key={contact.Id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
<td className="py-4 px-6">
                       <div className="flex items-center">
                         <Avatar name={contact.Name || 'N/A'} size="sm" />
                         <div className="ml-3">
                           <div className="font-medium text-gray-900">{contact.Name || 'N/A'}</div>
                           <div className="text-sm text-gray-500">{contact.email_c || 'N/A'}</div>
                         </div>
                       </div>
                     </td>
                     <td className="py-4 px-6">
                       <div className="font-medium text-gray-900">{contact.company_c || 'N/A'}</div>
                     </td>
                     <td className="py-4 px-6">
                       <Badge variant={getStatusColor(contact.status_c)}>
                         {contact.status_c || 'New'}
                       </Badge>
                     </td>
<td className="py-4 px-6">
                       <div className="flex items-center">
                         <Avatar name={contact.assigned_rep_c || 'Unassigned'} size="sm" />
                         <span className="ml-2 text-sm text-gray-900">{contact.assigned_rep_c || 'Unassigned'}</span>
                       </div>
                     </td>
                     <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info("Edit functionality coming soon")}
                        >
                          <ApperIcon name="Edit" size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info("Message functionality coming soon")}
                        >
                          <ApperIcon name="Mail" size={14} />
                        </Button>
<select
                           value={contact.status_c || 'New'}
                           onChange={(e) => handleStatusChange(contact.Id, e.target.value)}
                           className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                         >
                           <option value="New">New</option>
                           <option value="Contacted">Contacted</option>
                           <option value="Qualified">Qualified</option>
                           <option value="Unqualified">Unqualified</option>
                           <option value="Customer">Customer</option>
                         </select>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Contacts;