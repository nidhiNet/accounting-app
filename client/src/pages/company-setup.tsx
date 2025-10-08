import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Save, Globe, Calendar, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_CURRENCIES } from "@/lib/currency-utils";
import type { Company, InsertCompany } from "@shared/schema";
import { insertCompanySchema } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

// Mock company ID and user ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";
const MOCK_USER_ID = "mock-user-id";

// Use shared schema with frontend-specific validation
const companySchema = insertCompanySchema.extend({
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companySchema>;

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
];

const FISCAL_YEAR_ENDS = [
  { value: "12-31", label: "December 31" },
  { value: "03-31", label: "March 31" },
  { value: "06-30", label: "June 30" },
  { value: "09-30", label: "September 30" },
];

export default function CompanySetup() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ["/api/companies", MOCK_COMPANY_ID],
  });

  // Only allow editing when company data is successfully loaded
  const canEdit = company && !error && !isLoading;

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: Partial<InsertCompany>) => {
      const response = await apiRequest("PUT", `/api/companies/${MOCK_COMPANY_ID}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      legalName: "",
      taxId: "",
      registrationNumber: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "US",
        postalCode: "",
      },
      phone: "",
      email: "",
      website: "",
      accountingStandard: "US_GAAP",
      baseCurrency: "USD",
      fiscalYearEnd: "12-31",
      createdBy: MOCK_USER_ID,
    },
  });

  // Sync form with loaded company data - only when entering edit mode
  useEffect(() => {
    if (isEditing && company) {
      const formData = {
        name: company.name,
        legalName: company.legalName,
        taxId: company.taxId,
        registrationNumber: company.registrationNumber || "",
        address: company.address as any,
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        accountingStandard: company.accountingStandard as "US_GAAP" | "IFRS",
        baseCurrency: company.baseCurrency,
        fiscalYearEnd: company.fiscalYearEnd,
        createdBy: company.createdBy,
      };
      
      // Use setTimeout to ensure form context is stable
      setTimeout(() => {
        form.reset(formData);
      }, 0);
    }
  }, [isEditing, company, form]);

  const onSubmit = (data: CompanyFormData) => {
    updateCompanyMutation.mutate({
      ...data,
      updatedAt: new Date(),
    });
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center" data-testid="page-title">
            <Building className="h-6 w-6 mr-2" />
            Company Setup
          </h1>
          <p className="text-muted-foreground">Manage your company information and accounting settings</p>
        </div>
        {!isEditing && canEdit && (
          <Button onClick={() => setIsEditing(true)} data-testid="button-edit-company">
            Edit Company
          </Button>
        )}
      </div>

      {isEditing ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Company Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="legalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-legal-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="12-3456789" data-testid="input-tax-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="registrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Number (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-registration-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1 (555) 123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} placeholder="contact@company.com" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://www.company.com" data-testid="input-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Address Fields */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Address</h4>
                      <FormField
                        control={form.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-street" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="address.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-postal-code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-country">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateCompanyMutation.isPending}
                        data-testid="button-save-company"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Accounting Settings - Edit Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      Accounting Standards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="accountingStandard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accounting Standard</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-accounting-standard">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="US_GAAP">US GAAP</SelectItem>
                                <SelectItem value="IFRS">IFRS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="baseCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-base-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUPPORTED_CURRENCIES.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.code} - {currency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fiscalYearEnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fiscal Year End</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-fiscal-year-end">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {FISCAL_YEAR_ENDS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Important Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {company ? (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Company Created</Label>
                          <p className="mt-1" data-testid="text-created-date">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                          <p className="mt-1" data-testid="text-updated-date">
                            {new Date(company.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No date information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Submit buttons for edit mode */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCompanyMutation.isPending}
                data-testid="button-save-company"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load company information</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      ) : company ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Information Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                      <p className="mt-1" data-testid="text-company-name">{company.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Legal Name</Label>
                      <p className="mt-1" data-testid="text-legal-name">{company.legalName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                      <p className="mt-1" data-testid="text-tax-id">{company.taxId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                      <p className="mt-1" data-testid="text-registration-number">{company.registrationNumber || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="mt-1" data-testid="text-phone">{company.phone || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="mt-1" data-testid="text-email">{company.email || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                    <p className="mt-1" data-testid="text-website">{company.website || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="mt-1" data-testid="text-address">
                      {company.address.street}<br />
                      {company.address.city}, {company.address.state} {company.address.postalCode}<br />
                      {COUNTRIES.find(c => c.code === company.address.country)?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accounting Settings Display */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Accounting Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Accounting Standard</Label>
                    <p className="mt-1" data-testid="text-accounting-standard">
                      {company.accountingStandard === "US_GAAP" ? "US GAAP" : "IFRS"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Base Currency</Label>
                    <p className="mt-1" data-testid="text-base-currency">
                      {SUPPORTED_CURRENCIES.find(c => c.code === company.baseCurrency)?.name || company.baseCurrency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fiscal Year End</Label>
                    <p className="mt-1" data-testid="text-fiscal-year-end">
                      {FISCAL_YEAR_ENDS.find(f => f.value === company.fiscalYearEnd)?.label || company.fiscalYearEnd}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Company Created</Label>
                    <p className="mt-1" data-testid="text-created-date">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="mt-1" data-testid="text-updated-date">
                      {new Date(company.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No company information available</p>
        </div>
      )}
    </div>
  );
}
